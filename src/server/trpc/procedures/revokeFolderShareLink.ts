import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { authenticateUser } from "~/server/utils/auth";

export const revokeFolderShareLink = baseProcedure
  .input(z.object({
    token: z.string(),
    shareId: z.number(),
  }))
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);
    
    // Get the share link with related data
    const shareLink = await db.folderShareLink.findUnique({
      where: { id: input.shareId },
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

    if (!shareLink) {
      throw new Error("Share link not found");
    }

    const userAccess = shareLink.dataRoom.userAccess[0];
    
    // Check permissions - user must be the creator or have admin permissions
    if (shareLink.createdById !== user.id && 
        (!userAccess || (userAccess.role !== "ROOM_OWNER" && !userAccess.canManageUsers))) {
      throw new Error("You don't have permission to revoke this share link");
    }

    // Deactivate the share link
    await db.folderShareLink.update({
      where: { id: input.shareId },
      data: { isActive: false },
    });

    return { success: true };
  });
