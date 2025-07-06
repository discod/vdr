import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { authenticateUser, logAuditEvent } from "~/server/utils/auth";
import { minioClient } from "~/server/minio";

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

    // Generate presigned URL for viewing (expires in 1 hour)
    const presignedUrl = await minioClient.presignedGetObject(
      "vdr-documents",
      file.storageKey,
      60 * 60 // 1 hour
    );

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
    };
  });
