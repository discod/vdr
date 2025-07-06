import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { minioClient } from "~/server/minio";
import { db } from "~/server/db";
import { authenticateUser } from "~/server/utils/auth";
import { v4 as uuidv4 } from "uuid";

export const generatePresignedUrl = baseProcedure
  .input(z.object({
    token: z.string(),
    dataRoomId: z.number(),
    folderId: z.number().optional(),
    fileName: z.string(),
    fileSize: z.number(),
    mimeType: z.string(),
  }))
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);
    
    // Check if user has upload permission for this data room
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

    // Generate unique storage key
    const fileExtension = input.fileName.split('.').pop();
    const storageKey = `${input.dataRoomId}/${uuidv4()}.${fileExtension}`;

    // Generate presigned URL (expires in 1 hour)
    const presignedUrl = await minioClient.presignedPutObject(
      "vdr-documents",
      storageKey,
      60 * 60 // 1 hour
    );

    return {
      presignedUrl,
      storageKey,
    };
  });
