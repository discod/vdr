import { z } from "zod";
import { baseProcedure } from "../main";
import { authenticateUser, logAuditEvent } from "../../utils/auth";
import { emailService } from "../../utils/email";
import { db } from "../../db";

export const reviewAccessRequest = baseProcedure
  .input(
    z.object({
      token: z.string(),
      requestId: z.number(),
      action: z.enum(["APPROVE", "DENY"]),
      role: z.enum(["ADMIN", "CONTRIBUTOR", "VIEWER", "AUDITOR"]).optional(),
      message: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Get the access request
    const accessRequest = await db.accessRequest.findUnique({
      where: { id: input.requestId },
      include: {
        user: true,
        dataRoom: true,
        folder: true,
      },
    });

    if (!accessRequest) {
      throw new Error("Access request not found");
    }

    if (accessRequest.status !== "PENDING") {
      throw new Error("Access request has already been reviewed");
    }

    // Check if user has permission to manage this data room
    const userAccess = await db.userRoomAccess.findFirst({
      where: {
        userId: user.id,
        dataRoomId: accessRequest.dataRoomId,
        canEdit: true,
      },
    });

    if (!userAccess) {
      throw new Error("You don't have permission to review access requests for this data room");
    }

    // Update the access request
    const updatedRequest = await db.accessRequest.update({
      where: { id: input.requestId },
      data: {
        status: input.action === "APPROVE" ? "APPROVED" : "DENIED",
        reviewedBy: user.id,
        reviewedAt: new Date(),
      },
    });

    // If approved, create user room access
    if (input.action === "APPROVE") {
      const role = input.role || "VIEWER";
      
      // Check if user already has access
      const existingAccess = await db.userRoomAccess.findUnique({
        where: {
          userId_dataRoomId: {
            userId: accessRequest.userId,
            dataRoomId: accessRequest.dataRoomId,
          },
        },
      });

      if (!existingAccess) {
        await db.userRoomAccess.create({
          data: {
            userId: accessRequest.userId,
            dataRoomId: accessRequest.dataRoomId,
            role,
            canView: true,
            canDownload: role !== "AUDITOR",
            canPrint: role !== "AUDITOR",
            canUpload: ["ADMIN", "CONTRIBUTOR"].includes(role),
            canEdit: role === "ADMIN",
            canInvite: role === "ADMIN",
            canManageQA: ["ADMIN", "CONTRIBUTOR"].includes(role),
            canViewAudit: ["ADMIN", "AUDITOR"].includes(role),
          },
        });
      }
    }

    // Send notification email to requester
    try {
      await emailService.sendEmail({
        to: accessRequest.user.email,
        subject: `Access request ${input.action.toLowerCase()} for ${accessRequest.dataRoom.name}`,
        html: generateAccessResponseEmail(
          accessRequest.user.firstName,
          accessRequest.dataRoom.name,
          input.action === "APPROVE",
          input.message || '',
          `${user.firstName} ${user.lastName}`,
          accessRequest.dataRoomId
        ),
        text: `Your access request for ${accessRequest.dataRoom.name} has been ${input.action.toLowerCase()}.${input.message ? ` Message: ${input.message}` : ''}`,
      });
    } catch (error) {
      console.error('Failed to send access response email:', error);
    }

    await logAuditEvent({
      userId: user.id,
      action: input.action === "APPROVE" ? "APPROVE_ACCESS" : "DENY_ACCESS",
      resource: "ROOM",
      resourceId: accessRequest.dataRoomId,
      dataRoomId: accessRequest.dataRoomId,
      details: JSON.stringify({
        requestId: input.requestId,
        requesterId: accessRequest.userId,
        role: input.role,
        message: input.message,
      }),
    });

    return {
      success: true,
      status: updatedRequest.status,
    };
  });

function generateAccessResponseEmail(
  requesterName: string,
  dataRoomName: string,
  approved: boolean,
  message: string,
  reviewerName: string,
  dataRoomId: number
): string {
  const status = approved ? "approved" : "denied";
  const color = approved ? "#16a34a" : "#dc2626";
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${color};">Access Request ${approved ? 'Approved' : 'Denied'}</h2>
      <p>Hi ${requesterName},</p>
      <p>Your access request for <strong>${dataRoomName}</strong> has been <strong>${status}</strong> by ${reviewerName}.</p>
      
      ${message ? `
        <div style="background-color: #f8f9fa; padding: 16px; border-radius: 4px; margin: 16px 0;">
          <p><strong>Message:</strong></p>
          <p style="margin: 0; font-style: italic;">"${message}"</p>
        </div>
      ` : ''}
      
      ${approved ? `
        <p style="margin: 20px 0;">
          <a href="${process.env.BASE_URL || 'http://localhost:3000'}/data-rooms/${dataRoomId}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Access Data Room
          </a>
        </p>
      ` : ''}
      
      <p style="color: #666; font-size: 14px;">
        ${approved ? 'You can now access the data room.' : 'If you have questions about this decision, please contact the data room administrator.'}
      </p>
    </div>
  `;
}
