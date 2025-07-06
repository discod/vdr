import { z } from "zod";
import { randomBytes } from "crypto";
import { baseProcedure } from "../main";
import { authenticateUser, logAuditEvent, hashPassword } from "../../utils/auth";
import { db } from "../../db";

export const generateFileShareLink = baseProcedure
  .input(
    z.object({
      token: z.string(),
      fileId: z.number(),
      expiresAt: z.string().optional(),
      maxViews: z.number().min(1).optional(),
      password: z.string().optional(),
      allowDownload: z.boolean().default(true),
      allowPrint: z.boolean().default(true),
      requireAuth: z.boolean().default(false),
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

    // Generate unique token
    const shareToken = randomBytes(32).toString('hex');

    // Hash password if provided
    let hashedPassword = null;
    if (input.password) {
      hashedPassword = await hashPassword(input.password);
    }

    // Create share link
    const shareLink = await db.fileShareLink.create({
      data: {
        token: shareToken,
        fileId: input.fileId,
        createdById: user.id,
        maxViews: input.maxViews,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        password: hashedPassword,
        allowDownload: input.allowDownload,
        allowPrint: input.allowPrint,
        requireAuth: input.requireAuth,
      },
    });

    // Generate share URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/share/${shareToken}`;

    await logAuditEvent({
      userId: user.id,
      action: "CREATE_FILE_SHARE_LINK",
      resource: "FILE",
      resourceId: input.fileId,
      fileId: input.fileId,
      dataRoomId: file.dataRoomId,
      details: {
        shareId: shareLink.id,
        expiresAt: input.expiresAt,
        maxViews: input.maxViews,
        hasPassword: !!input.password,
        requireAuth: input.requireAuth,
      },
    });

    return {
      shareId: shareLink.id,
      shareUrl,
      token: shareToken,
    };
  });
