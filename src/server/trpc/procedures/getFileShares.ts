import { z } from "zod";
import { baseProcedure } from "../main";
import { authenticateUser } from "../../utils/auth";
import { db } from "../../db";

export const getFileShares = baseProcedure
  .input(
    z.object({
      token: z.string(),
      fileId: z.number(),
    })
  )
  .query(async ({ input }) => {
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
    });

    if (!file) {
      throw new Error("File not found or access denied");
    }

    // Get all active shares for this file created by the current user
    const shares = await db.fileShareLink.findMany({
      where: {
        fileId: input.fileId,
        createdById: user.id,
        isActive: true,
      },
      include: {
        accessLogs: {
          orderBy: { accessedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add share URLs and format response
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    
    return shares.map(share => ({
      id: share.id,
      token: share.token,
      shareUrl: `${baseUrl}/share/${share.token}`,
      recipientEmail: share.recipientEmail,
      recipientName: share.recipientName,
      message: share.message,
      maxViews: share.maxViews,
      currentViews: share.currentViews,
      expiresAt: share.expiresAt,
      password: !!share.password, // Only return boolean, not the actual password
      allowDownload: share.allowDownload,
      allowPrint: share.allowPrint,
      requireAuth: share.requireAuth,
      isActive: share.isActive,
      lastAccessedAt: share.lastAccessedAt,
      createdAt: share.createdAt,
    }));
  });
