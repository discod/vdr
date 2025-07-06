import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { authenticateUser } from "~/server/utils/auth";

export const getFolderShares = baseProcedure
  .input(z.object({
    token: z.string(),
    folderId: z.number().nullable(), // null for root folder
    dataRoomId: z.number(),
  }))
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);
    
    // Check if user has permission to view shares in this data room
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
    if (!userAccess || (!userAccess.canView && userAccess.role !== "ROOM_OWNER")) {
      throw new Error("You don't have permission to view shares in this data room");
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

    // Get active folder shares
    const shares = await db.folderShareLink.findMany({
      where: {
        folderId: input.folderId,
        dataRoomId: input.dataRoomId,
        isActive: true,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            accessLogs: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Generate share URLs and format response
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    
    return shares.map(share => ({
      id: share.id,
      token: share.token,
      shareUrl: `${baseUrl}/shared/folder/${share.token}`,
      recipientEmail: share.recipientEmail,
      recipientName: share.recipientName,
      message: share.message,
      maxViews: share.maxViews,
      currentViews: share.currentViews,
      expiresAt: share.expiresAt,
      allowDownload: share.allowDownload,
      allowPrint: share.allowPrint,
      requireAuth: share.requireAuth,
      password: !!share.password, // Only return whether password exists
      lastAccessedAt: share.lastAccessedAt,
      createdAt: share.createdAt,
      createdBy: share.createdBy,
      totalAccesses: share._count.accessLogs,
    }));
  });
