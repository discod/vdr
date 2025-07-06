import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { authenticateUser, logAuditEvent } from "~/server/utils/auth";

export const createDocumentNote = baseProcedure
  .input(z.object({
    token: z.string(),
    fileId: z.number(),
    content: z.string(),
    isPrivate: z.boolean().default(false),
    pageNumber: z.number().optional(),
    coordinates: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number().optional(),
      height: z.number().optional(),
    }).optional(),
  }))
  .mutation(async ({ input }) => {
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

    // Create note
    const note = await db.documentNote.create({
      data: {
        content: input.content,
        isPrivate: input.isPrivate,
        pageNumber: input.pageNumber,
        coordinates: input.coordinates ? JSON.stringify(input.coordinates) : null,
        fileId: input.fileId,
        authorId: user.id,
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
    });

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      action: 'CREATE',
      resource: 'NOTE',
      resourceId: note.id,
      dataRoomId: file.dataRoomId,
      fileId: file.id,
      details: JSON.stringify({
        noteId: note.id,
        isPrivate: input.isPrivate,
        pageNumber: input.pageNumber,
      }),
    });

    return note;
  });
