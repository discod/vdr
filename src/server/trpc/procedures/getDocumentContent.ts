import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { authenticateUser, logAuditEvent } from "~/server/utils/auth";
import { minioClient } from "~/server/minio";
import { watermarkService } from "~/server/utils/watermark";
import { createHash } from "crypto";

export const getDocumentContent = baseProcedure
  .input(z.object({
    token: z.string(),
    fileId: z.number(),
  }))
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);
    
    // Get file and check permissions
    const file = await db.file.findUnique({
      where: { id: input.fileId },
      include: {
        dataRoom: {
          include: {
            userAccess: {
              where: { userId: user.id },
            },
          },
        },
      },
    });

    if (!file) {
      throw new Error("File not found");
    }

    const userAccess = file.dataRoom.userAccess[0];
    if (!userAccess || !userAccess.canView) {
      throw new Error("You don't have permission to view this file");
    }

    // Check if file is favorited by the user
    const favorite = await db.fileFavorite.findUnique({
      where: {
        userId_fileId: {
          userId: user.id,
          fileId: input.fileId,
        },
      },
    });

    let presignedUrl: string;
    
    // Apply watermark if enabled
    if (file.dataRoom.watermarkEnabled) {
      try {
        // Generate a unique key for the watermarked version
        const watermarkHash = createHash('md5')
          .update(`${file.id}-${user.id}-${Date.now()}`)
          .digest('hex');
        const watermarkedKey = `watermarked/${watermarkHash}-${file.name}`;
        
        // Download original file
        const originalStream = await minioClient.getObject("vdr-documents", file.storageKey);
        const chunks: Buffer[] = [];
        
        for await (const chunk of originalStream) {
          chunks.push(chunk);
        }
        const originalBuffer = Buffer.concat(chunks);
        
        // Apply watermark based on file type
        let watermarkedBuffer: Buffer;
        const watermarkOptions = {
          userEmail: user.email,
          userName: `${user.firstName} ${user.lastName}`,
          timestamp: new Date(),
          dataRoomName: file.dataRoom.name,
          ipAddress: '127.0.0.1', // TODO: Get actual IP from request
        };
        
        if (file.mimeType === 'application/pdf') {
          watermarkedBuffer = await watermarkService.applyPDFWatermark(originalBuffer, watermarkOptions);
        } else if (file.mimeType.startsWith('image/')) {
          watermarkedBuffer = await watermarkService.applyImageWatermark(originalBuffer, watermarkOptions);
        } else {
          // For non-supported formats, use original
          watermarkedBuffer = originalBuffer;
        }
        
        // Upload watermarked version to temporary location
        await minioClient.putObject(
          "vdr-documents", 
          watermarkedKey, 
          watermarkedBuffer,
          {
            'Content-Type': file.mimeType,
            'X-Amz-Meta-Original-File-Id': file.id.toString(),
            'X-Amz-Meta-User-Id': user.id.toString(),
            'X-Amz-Meta-Expires': (Date.now() + 60 * 60 * 1000).toString(), // 1 hour
          }
        );
        
        // Generate presigned URL for watermarked version (expires in 30 minutes)
        presignedUrl = await minioClient.presignedGetObject(
          "vdr-documents",
          watermarkedKey,
          30 * 60 // 30 minutes
        );
        
        // Schedule cleanup of temporary file (in a real implementation, you'd use a job queue)
        setTimeout(async () => {
          try {
            await minioClient.removeObject("vdr-documents", watermarkedKey);
          } catch (error) {
            console.error('Failed to cleanup watermarked file:', error);
          }
        }, 60 * 60 * 1000); // 1 hour
        
      } catch (error) {
        console.error('Failed to apply watermark:', error);
        // Fallback to original file if watermarking fails
        presignedUrl = await minioClient.presignedGetObject(
          "vdr-documents",
          file.storageKey,
          60 * 60 // 1 hour
        );
      }
    } else {
      // Generate presigned URL for original file (expires in 1 hour)
      presignedUrl = await minioClient.presignedGetObject(
        "vdr-documents",
        file.storageKey,
        60 * 60 // 1 hour
      );
    }

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      action: 'VIEW',
      resource: 'FILE',
      resourceId: file.id,
      dataRoomId: file.dataRoomId,
      fileId: file.id,
      details: JSON.stringify({
        fileName: file.name,
        mimeType: file.mimeType,
        watermarked: file.dataRoom.watermarkEnabled,
      }),
    });

    return {
      presignedUrl,
      file: {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        watermarkEnabled: file.dataRoom.watermarkEnabled,
        canDownload: userAccess.canDownload && file.dataRoom.allowDownload,
        canPrint: userAccess.canPrint && file.dataRoom.allowPrint,
      },
      isFavorited: !!favorite,
    };
  });
