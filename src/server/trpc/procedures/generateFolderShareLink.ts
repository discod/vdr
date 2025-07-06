import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { authenticateUser } from "~/server/utils/auth";
import { createHash } from "crypto";

export const generateFolderShareLink = baseProcedure
  .input(z.object({
    token: z.string(),
    folderId: z.number().nullable(), // null for root folder
    dataRoomId: z.number(),
    expiresAt: z.string().nullable().optional(),
    maxViews: z.number().optional(),
    password: z.string().optional(),
    allowDownload: z.boolean().default(true),
    allowPrint: z.boolean().default(true),
    requireAuth: z.boolean().default(false),
  }))
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);
    
    // Check if user has permission to share folders in this data room
    const dataRoom = await db.dataRoom.findUnique({
      where: { id: input.dataRoomId },
      include: {
        userAccess: {
          where: { userId: user.id },
        },
      },
    });

    if (!dataRoom) {
      throw new Error("Data room not found");
    }

    const userAccess = dataRoom.userAccess[0];
    if (!userAccess || (!userAccess.canInvite && userAccess.role !== "ROOM_OWNER")) {
      throw new Error("You don't have permission to share folders in this data room");
    }

    // If folderId is provided, verify the folder exists and belongs to the data room
    if (input.folderId) {
      const folder = await db.folder.findUnique({
        where: { id: input.folderId },
      });

      if (!folder || folder.dataRoomId !== input.dataRoomId) {
        throw new Error("Folder not found or doesn't belong to this data room");
      }
    }

    // Generate unique token
    const tokenData = `${input.dataRoomId}-${input.folderId || 'root'}-${user.id}-${Date.now()}`;
    const token = createHash('sha256').update(tokenData).digest('hex').substring(0, 32);

    // Create folder share link
    const shareLink = await db.folderShareLink.create({
      data: {
        token,
        folderId: input.folderId,
        dataRoomId: input.dataRoomId,
        createdById: user.id,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        maxViews: input.maxViews,
        password: input.password,
        allowDownload: input.allowDownload,
        allowPrint: input.allowPrint,
        requireAuth: input.requireAuth,
      },
    });

    // Generate share URL
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const shareUrl = `${baseUrl}/shared/folder/${token}`;

    return {
      id: shareLink.id,
      token: shareLink.token,
      shareUrl,
      expiresAt: shareLink.expiresAt,
      maxViews: shareLink.maxViews,
    };
  });
