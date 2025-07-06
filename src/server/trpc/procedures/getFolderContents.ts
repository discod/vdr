import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser, logAuditEvent } from "~/server/utils/auth";

export const getFolderContents = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      folderId: z.number().nullable(),
      dataRoomId: z.number(),
    })
  )
  .query(async ({ input }) => {
    const user = await authenticateUser(input.authToken);

    // Check if user has access to this room
    const userAccess = await db.userRoomAccess.findUnique({
      where: {
        userId_dataRoomId: {
          userId: user.id,
          dataRoomId: input.dataRoomId,
        },
      },
    });

    if (!userAccess || !userAccess.canView) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Access denied to this data room",
      });
    }

    // For root folder (folderId is null), skip folder verification
    // For specific folders, verify the folder exists and belongs to the data room
    let folder = null;
    if (input.folderId !== null) {
      folder = await db.folder.findUnique({
        where: { id: input.folderId },
        select: {
          id: true,
          name: true,
          dataRoomId: true,
          parentId: true,
        },
      });

      if (!folder || folder.dataRoomId !== input.dataRoomId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Folder not found or doesn't belong to this data room",
        });
      }
    }

    // Get subfolders within this folder (or root level if folderId is null)
    const subfolders = await db.folder.findMany({
      where: { 
        parentId: input.folderId,
        dataRoomId: input.dataRoomId,
      },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { files: true },
        },
      },
    });

    // Get files within this folder (or root level if folderId is null)
    const files = await db.file.findMany({
      where: { 
        folderId: input.folderId,
        dataRoomId: input.dataRoomId,
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        size: true,
        mimeType: true,
        uploadedAt: true,
        uploader: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        favorites: {
          where: { userId: user.id },
          select: { id: true },
        },
      },
    });

    // Add isFavorited flag to files
    const filesWithFavorites = files.map(file => ({
      ...file,
      isFavorited: file.favorites.length > 0,
      favorites: undefined, // Remove the favorites array from response
    }));

    // Log audit event (only if viewing a specific folder, not root)
    if (input.folderId !== null) {
      await logAuditEvent({
        userId: user.id,
        action: "VIEW",
        resource: "FOLDER",
        resourceId: input.folderId,
        dataRoomId: input.dataRoomId,
      });
    } else {
      // Log root folder access
      await logAuditEvent({
        userId: user.id,
        action: "VIEW",
        resource: "DATA_ROOM",
        resourceId: input.dataRoomId,
        dataRoomId: input.dataRoomId,
      });
    }

    return {
      folder,
      subfolders,
      files: filesWithFavorites,
      userPermissions: userAccess,
    };
  });
