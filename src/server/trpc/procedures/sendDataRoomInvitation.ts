import { z } from "zod";
import { randomBytes } from "crypto";
import { baseProcedure } from "../main";
import { authenticateUser, logAuditEvent } from "../../utils/auth";
import { emailService } from "../../utils/email";
import { db } from "../../db";

export const sendDataRoomInvitation = baseProcedure
  .input(
    z.object({
      token: z.string(),
      dataRoomId: z.number(),
      email: z.string().email(),
      role: z.enum(["ADMIN", "CONTRIBUTOR", "VIEWER", "AUDITOR"]),
      groupIds: z.array(z.number()).optional(),
      message: z.string().optional(),
      expiresInDays: z.number().min(1).max(30).default(7),
      permissionTemplateId: z.number().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Verify user has permission to invite others to this data room
    const userAccess = await db.userRoomAccess.findFirst({
      where: {
        userId: user.id,
        dataRoomId: input.dataRoomId,
        OR: [
          { canInvite: true },
          { canManageUsers: true },
          { role: "ROOM_OWNER" }
        ],
      },
      include: {
        dataRoom: true,
      },
    });

    if (!userAccess) {
      throw new Error("You don't have permission to invite users to this data room");
    }

    // Check if user is already invited or has access
    const existingAccess = await db.userRoomAccess.findFirst({
      where: {
        dataRoomId: input.dataRoomId,
        user: {
          email: input.email.toLowerCase(),
        },
      },
    });

    if (existingAccess) {
      throw new Error("User already has access to this data room");
    }

    const existingInvitation = await db.invitation.findFirst({
      where: {
        email: input.email.toLowerCase(),
        dataRoomId: input.dataRoomId,
        status: "PENDING",
      },
    });

    if (existingInvitation) {
      throw new Error("User already has a pending invitation to this data room");
    }

    // Generate unique token
    const invitationToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

    // Create invitation with group assignments
    const invitation = await db.invitation.create({
      data: {
        email: input.email.toLowerCase(),
        dataRoomId: input.dataRoomId,
        senderId: user.id,
        role: input.role,
        groupIds: input.groupIds || [],
        message: input.message,
        token: invitationToken,
        expiresAt,
      },
    });

    // Generate invitation URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const invitationUrl = `${baseUrl}/auth/register?invitation=${invitationToken}`;

    // Generate email template
    const emailTemplate = emailService.generateInvitationEmail(
      `${user.firstName} ${user.lastName}`,
      userAccess.dataRoom.name,
      invitationUrl
    );

    // Send email
    try {
      await emailService.sendEmail({
        to: input.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });
    } catch (error) {
      // If email fails, delete the invitation
      await db.invitation.delete({
        where: { id: invitation.id },
      });
      throw new Error("Failed to send invitation email");
    }

    await logAuditEvent({
      userId: user.id,
      action: "SEND_INVITATION",
      resource: "ROOM",
      resourceId: input.dataRoomId,
      dataRoomId: input.dataRoomId,
      details: JSON.stringify({
        invitationId: invitation.id,
        recipientEmail: input.email,
        role: input.role,
        expiresAt: expiresAt.toISOString(),
      }),
    });

    return {
      invitationId: invitation.id,
      success: true,
    };
  });
