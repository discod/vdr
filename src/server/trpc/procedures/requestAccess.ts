import { z } from "zod";
import { baseProcedure } from "../main";
import { authenticateUser, logAuditEvent } from "../../utils/auth";
import { emailService } from "../../utils/email";
import { db } from "../../db";

export const requestAccess = baseProcedure
  .input(
    z.object({
      token: z.string(),
      dataRoomId: z.number(),
      folderId: z.number().optional(),
      reason: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Get data room details
    const dataRoom = await db.dataRoom.findUnique({
      where: { id: input.dataRoomId },
      include: {
        creator: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        userAccess: {
          where: {
            canEdit: true,
          },
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!dataRoom) {
      throw new Error("Data room not found");
    }

    // Check if user already has a pending request
    const existingRequest = await db.accessRequest.findFirst({
      where: {
        userId: user.id,
        dataRoomId: input.dataRoomId,
        folderId: input.folderId,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      throw new Error("You already have a pending access request");
    }

    // Create access request
    const accessRequest = await db.accessRequest.create({
      data: {
        userId: user.id,
        dataRoomId: input.dataRoomId,
        folderId: input.folderId,
        reason: input.reason,
        status: "PENDING",
      },
    });

    // Notify administrators
    const adminEmails = [
      dataRoom.creator.email,
      ...dataRoom.userAccess.map(access => access.user.email),
    ];

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const requestUrl = `${baseUrl}/data-rooms/${input.dataRoomId}?tab=users&request=${accessRequest.id}`;

    for (const adminEmail of adminEmails) {
      try {
        await emailService.sendEmail({
          to: adminEmail,
          subject: `Access request for ${dataRoom.name}`,
          html: generateAccessRequestEmail(
            `${user.firstName} ${user.lastName}`,
            user.email,
            dataRoom.name,
            input.reason || '',
            requestUrl
          ),
          text: `${user.firstName} ${user.lastName} (${user.email}) has requested access to ${dataRoom.name}. Reason: ${input.reason || 'None provided'}. Review at: ${requestUrl}`,
        });
      } catch (error) {
        console.error('Failed to send access request email:', error);
      }
    }

    await logAuditEvent({
      userId: user.id,
      action: "REQUEST_ACCESS",
      resource: "ROOM",
      resourceId: input.dataRoomId,
      dataRoomId: input.dataRoomId,
      details: JSON.stringify({
        requestId: accessRequest.id,
        folderId: input.folderId,
        reason: input.reason,
      }),
    });

    return {
      requestId: accessRequest.id,
      success: true,
    };
  });

function generateAccessRequestEmail(
  requesterName: string,
  requesterEmail: string,
  dataRoomName: string,
  reason: string,
  requestUrl: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Access Request</h2>
      <p><strong>${requesterName}</strong> (${requesterEmail}) has requested access to the data room <strong>${dataRoomName}</strong>.</p>
      
      ${reason ? `
        <div style="background-color: #f8f9fa; padding: 16px; border-radius: 4px; margin: 16px 0;">
          <p><strong>Reason:</strong></p>
          <p style="margin: 0; font-style: italic;">"${reason}"</p>
        </div>
      ` : ''}
      
      <p style="margin: 20px 0;">
        <a href="${requestUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Review Request
        </a>
      </p>
      
      <p style="color: #666; font-size: 14px;">
        You can approve or deny this request from the data room's user management section.
      </p>
    </div>
  `;
}
