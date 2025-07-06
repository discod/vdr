import { z } from "zod";
import { baseProcedure } from "../main";
import { authenticateUser } from "../../utils/auth";
import { db } from "../../db";

export const getUserFavorites = baseProcedure
  .input(
    z.object({
      token: z.string(),
      dataRoomId: z.number().optional(),
    })
  )
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Build where clause
    const whereClause: any = {
      userId: user.id,
    };

    if (input.dataRoomId) {
      whereClause.file = {
        dataRoomId: input.dataRoomId,
      };
    }

    // Get user's favorite files
    const favorites = await db.fileFavorite.findMany({
      where: whereClause,
      include: {
        file: {
          include: {
            dataRoom: {
              select: {
                id: true,
                name: true,
                userAccess: {
                  where: {
                    userId: user.id,
                    canView: true,
                  },
                  select: {
                    canView: true,
                    canDownload: true,
                    canPrint: true,
                  },
                },
              },
            },
            uploader: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Filter out files from data rooms the user no longer has access to
    const accessibleFavorites = favorites.filter(
      favorite => favorite.file.dataRoom.userAccess.length > 0
    );

    return accessibleFavorites.map(favorite => ({
      id: favorite.id,
      createdAt: favorite.createdAt,
      file: {
        id: favorite.file.id,
        name: favorite.file.name,
        size: favorite.file.size,
        mimeType: favorite.file.mimeType,
        uploadedAt: favorite.file.uploadedAt,
        uploader: favorite.file.uploader,
        dataRoom: {
          id: favorite.file.dataRoom.id,
          name: favorite.file.dataRoom.name,
        },
        permissions: favorite.file.dataRoom.userAccess[0],
      },
    }));
  });
