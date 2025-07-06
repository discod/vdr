import { z } from "zod";
import { baseProcedure } from "../main";
import { authenticateUser, logAuditEvent } from "../../utils/auth";
import { db } from "../../db";

export const revokeFileShareLink = baseProcedure
  .input(
    z.object({
      token: z.string(),
      shareId: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Find the share link and verify ownership
    const shareLink = await db.fileShareLink.findFirst({
      where: {
        id: input.shareId,
        createdById: user.id,
        isActive: true,
      },
      include: {
        file: {
          include: {
            dataRoom: true,
          },
        },
      },
    });

    if (!shareLink) {
      throw new Error("Share link not found or access denied");
    }

    // Deactivate the share link
    await db.fileShareLink.update({
      where: { id: input.shareId },
      data: { isActive: false },
    });

    await logAuditEvent({
      userId: user.id,
      action: "REVOKE_FILE_SHARE_LINK",
      resource: "FILE",
      resourceId: shareLink.fileId,
      fileId: shareLink.fileId,
      dataRoomId: shareLink.file.dataRoomId,
      details: {
        shareId: shareLink.id,
        shareToken: shareLink.token,
        recipientEmail: shareLink.recipientEmail,
      },
    });

    return { success: true };
  });
