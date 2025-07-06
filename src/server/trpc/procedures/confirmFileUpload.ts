import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { authenticateUser, logAuditEvent } from "~/server/utils/auth";
import { createHash } from "crypto";

export const confirmFileUpload = baseProcedure
  .input(z.object({
    token: z.string(),
    dataRoomId: z.number(),
    folderId: z.number().optional(),
    fileName: z.string(),
    originalName: z.string(),
    fileSize: z.number(),
    mimeType: z.string(),
    storageKey: z.string(),
    tags: z.array(z.string()).optional(),
  }))
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);
    
    // Verify user still has upload permission
    const userAccess = await db.userRoomAccess.findFirst({
      where: {
        userId: user.id,
        dataRoomId: input.dataRoomId,
        canUpload: true,
      },
    });

    if (!userAccess) {
      throw new Error("You don't have permission to upload files to this data room");
    }

    // Generate checksum (placeholder - in real implementation you'd get this from the uploaded file)
    const checksum = createHash('md5').update(input.storageKey).digest('hex');

    // Create file record
    const file = await db.file.create({
      data: {
        name: input.fileName,
        originalName: input.originalName,
        size: input.fileSize,
        mimeType: input.mimeType,
        checksum,
        storageKey: input.storageKey,
        dataRoomId: input.dataRoomId,
        folderId: input.folderId,
        uploaderId: user.id,
        tags: input.tags || [],
      },
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      action: 'UPLOAD',
      resource: 'FILE',
      resourceId: file.id,
      dataRoomId: input.dataRoomId,
      fileId: file.id,
      details: JSON.stringify({
        fileName: input.fileName,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
      }),
    });

    return file;
  });
