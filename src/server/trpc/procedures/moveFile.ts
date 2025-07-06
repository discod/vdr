import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { authenticateUser, logAuditEvent } from "~/server/utils/auth";

export const moveFile = baseProcedure
  .input(z.object({
    token: z.string(),
    fileId: z.number(),
    targetFolderId: z.number().nullable(), // null means move to root
    dataRoomId: z.number(),
  }))
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);
    
    // Check if user has edit permission for this data room
    const userAccess = await db.userRoomAccess.findFirst({
      where: {
        userId: user.id,
        dataRoomId: input.dataRoomId,
        canEdit: true,
      },
    });

    if (!userAccess) {
      throw new Error("You don't have permission to move files in this data room");
    }

    // Verify the file exists and belongs to the data room
    const file = await db.file.findFirst({
      where: {
        id: input.fileId,
        dataRoomId: input.dataRoomId,
      },
    });

    if (!file) {
      throw new Error("File not found or doesn't belong to this data room");
    }

    // If moving to a folder, verify the folder exists and belongs to the data room
    if (input.targetFolderId) {
      const folder = await db.folder.findFirst({
        where: {
          id: input.targetFolderId,
          dataRoomId: input.dataRoomId,
        },
      });

      if (!folder) {
        throw new Error("Target folder not found or doesn't belong to this data room");
      }
    }

    // Update the file's folderId
    const updatedFile = await db.file.update({
      where: {
        id: input.fileId,
      },
      data: {
        folderId: input.targetFolderId,
      },
      include: {
        folder: true,
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
      action: 'MOVE',
      resource: 'FILE',
      resourceId: file.id,
      dataRoomId: input.dataRoomId,
      fileId: file.id,
      details: JSON.stringify({
        fileName: file.name,
        fromFolderId: file.folderId,
        toFolderId: input.targetFolderId,
        targetFolderName: input.targetFolderId ? updatedFile.folder?.name : 'Root',
      }),
    });

    return updatedFile;
  });
