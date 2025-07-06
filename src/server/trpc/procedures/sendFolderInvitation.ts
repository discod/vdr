import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { authenticateUser } from "~/server/utils/auth";
import { createHash } from "crypto";

export const sendFolderInvitation = baseProcedure
  .input(z.object({
    token: z.string(),
    folderId: z.number().nullable(), // null for root folder
    dataRoomId: z.number(),
    recipientEmail: z.string().email(),
    recipientName: z.string(),
    message: z.string().optional(),
    expiresAt: z.string().nullable().optional(),
    maxViews: z.number().optional(),
    allowDownload: z.boolean().default(true),
    allowPrint: z.boolean().default(true),
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
    let folderName = "Root Folder";
    if (input.folderId) {
      const folder = await db.folder.findUnique({
        where: { id: input.folderId },
      });

      if (!folder || folder.dataRoomId !== input.dataRoomId) {
        throw new Error("Folder not found or doesn't belong to this data room");
      }
      folderName = folder.name;
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
        recipientEmail: input.recipientEmail,
        recipientName: input.recipientName,
        message: input.message,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        maxViews: input.maxViews,
        allowDownload: input.allowDownload,
        allowPrint: input.allowPrint,
        requireAuth: false, // Email invitations don't require additional auth
      },
    });

    // Generate share URL
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const shareUrl = `${baseUrl}/shared/folder/${token}`;

    // TODO: Send email invitation
    // This would integrate with your email service
    console.log(`Folder invitation would be sent to ${input.recipientEmail}`);
    console.log(`Share URL: ${shareUrl}`);
    console.log(`Folder: ${folderName} in ${dataRoom.name}`);
    console.log(`Message: ${input.message || 'No message'}`);

    return {
      id: shareLink.id,
      token: shareLink.token,
      shareUrl,
      recipientEmail: input.recipientEmail,
      recipientName: input.recipientName,
    };
  });
