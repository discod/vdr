import { z } from "zod";
import { randomBytes } from "crypto";
import { baseProcedure } from "../main";
import { authenticateUser, logAuditEvent } from "../../utils/auth";
import { emailService } from "../../utils/email";
import { db } from "../../db";

export const sendFileInvitation = baseProcedure
  .input(
    z.object({
      token: z.string(),
      fileId: z.number(),
      recipientEmail: z.string().email(),
      recipientName: z.string().min(1),
      message: z.string().optional(),
      expiresAt: z.string().optional(),
      maxViews: z.number().min(1).optional(),
      allowDownload: z.boolean().default(true),
      allowPrint: z.boolean().default(true),
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

    // Create share link with recipient info
    const shareLink = await db.fileShareLink.create({
      data: {
        token: shareToken,
        fileId: input.fileId,
        createdById: user.id,
        recipientEmail: input.recipientEmail,
        recipientName: input.recipientName,
        message: input.message,
        maxViews: input.maxViews,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        allowDownload: input.allowDownload,
        allowPrint: input.allowPrint,
        requireAuth: false, // Email invitations don't require additional auth
      },
    });

    // Generate share URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/share/${shareToken}`;

    // Generate email template
    const emailTemplate = generateFileInvitationEmail(
      `${user.firstName} ${user.lastName}`,
      file.name,
      input.recipientName,
      shareUrl,
      input.message
    );

    // Send email
    try {
      await emailService.sendEmail({
        to: input.recipientEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });
    } catch (error) {
      // If email fails, delete the share link
      await db.fileShareLink.delete({
        where: { id: shareLink.id },
      });
      throw new Error("Failed to send invitation email");
    }

    await logAuditEvent({
      userId: user.id,
      action: "SEND_FILE_INVITATION",
      resource: "FILE",
      resourceId: input.fileId,
      fileId: input.fileId,
      dataRoomId: file.dataRoomId,
      details: {
        shareId: shareLink.id,
        recipientEmail: input.recipientEmail,
        recipientName: input.recipientName,
        expiresAt: input.expiresAt,
        maxViews: input.maxViews,
      },
    });

    return {
      shareId: shareLink.id,
      success: true,
    };
  });

function generateFileInvitationEmail(
  senderName: string,
  fileName: string,
  recipientName: string,
  shareUrl: string,
  message?: string
) {
  const subject = `${senderName} shared a file with you: ${fileName}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">File Shared</h2>
      <p>Hi ${recipientName},</p>
      <p><strong>${senderName}</strong> has shared a file with you:</p>
      
      <div style="background-color: #f8f9fa; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0; color: #1f2937;">${fileName}</h3>
      </div>
      
      ${message ? `
        <div style="background-color: #eff6ff; padding: 16px; border-left: 4px solid #2563eb; margin: 20px 0;">
          <p style="margin: 0; font-style: italic;">"${message}"</p>
        </div>
      ` : ''}
      
      <p style="margin: 20px 0;">
        <a href="${shareUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          View File
        </a>
      </p>
      
      <p style="color: #666; font-size: 14px;">
        This link may have viewing limits or expiration. If you have any questions, please contact ${senderName}.
      </p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        This email was sent by VaultSpace. If you believe you received this email in error, please ignore it.
      </p>
    </div>
  `;
  
  const text = `${senderName} shared a file with you: ${fileName}. ${message ? `Message: "${message}". ` : ''}View the file at: ${shareUrl}`;

  return { subject, html, text };
}
