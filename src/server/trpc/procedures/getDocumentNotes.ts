import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { authenticateUser } from "~/server/utils/auth";

export const getDocumentNotes = baseProcedure
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

    // Get notes - show private notes only to the author
    const notes = await db.documentNote.findMany({
      where: {
        fileId: input.fileId,
        OR: [
          { isPrivate: false },
          { authorId: user.id },
        ],
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return notes;
  });
