import { z } from "zod";
import { baseProcedure } from "../main";
import { authenticateUser, logAuditEvent } from "../../utils/auth";
import { db } from "../../db";

export const toggleFileFavorite = baseProcedure
  .input(
    z.object({
      token: z.string(),
      fileId: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Verify user has access to the file
    const file = await db.file.findFirst({
      where: {
        id: input.fileId,
        dataRoom: {
          userAccess: {
            some: {
              userId: user.id,
              canView: true,
            },
          },
        },
      },
      include: {
        dataRoom: true,
      },
    });

    if (!file) {
      throw new Error("File not found or access denied");
    }

    // Check if file is already favorited
    const existingFavorite = await db.fileFavorite.findUnique({
      where: {
        userId_fileId: {
          userId: user.id,
          fileId: input.fileId,
        },
      },
    });

    let isFavorited: boolean;

    if (existingFavorite) {
      // Remove from favorites
      await db.fileFavorite.delete({
        where: {
          id: existingFavorite.id,
        },
      });
      isFavorited = false;
    } else {
      // Add to favorites
      await db.fileFavorite.create({
        data: {
          userId: user.id,
          fileId: input.fileId,
        },
      });
      isFavorited = true;
    }

    await logAuditEvent({
      userId: user.id,
      action: isFavorited ? "FAVORITE" : "UNFAVORITE",
      resource: "FILE",
      resourceId: input.fileId,
      fileId: input.fileId,
      dataRoomId: file.dataRoomId,
    });

    return {
      isFavorited,
      success: true,
    };
  });
