import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { hashPassword, signJWT, logAuditEvent } from "~/server/utils/auth";

function getPermissionsByRole(role: string) {
  switch (role) {
    case "ROOM_OWNER":
      return {
        canView: true,
        canDownload: true,
        canPrint: true,
        canUpload: true,
        canEdit: true,
        canInvite: true,
        canManageQA: true,
        canViewAudit: true,
        canManageUsers: true,
        canManageGroups: true,
        canManageRoom: true,
      };
    case "ADMIN":
      return {
        canView: true,
        canDownload: true,
        canPrint: true,
        canUpload: true,
        canEdit: true,
        canInvite: true,
        canManageQA: true,
        canViewAudit: true,
        canManageUsers: true,
        canManageGroups: false,
        canManageRoom: false,
      };
    case "CONTRIBUTOR":
      return {
        canView: true,
        canDownload: true,
        canPrint: true,
        canUpload: true,
        canEdit: false,
        canInvite: false,
        canManageQA: true,
        canViewAudit: false,
        canManageUsers: false,
        canManageGroups: false,
        canManageRoom: false,
      };
    case "VIEWER":
      return {
        canView: true,
        canDownload: true,
        canPrint: true,
        canUpload: false,
        canEdit: false,
        canInvite: false,
        canManageQA: false,
        canViewAudit: false,
        canManageUsers: false,
        canManageGroups: false,
        canManageRoom: false,
      };
    case "AUDITOR":
      return {
        canView: true,
        canDownload: false,
        canPrint: false,
        canUpload: false,
        canEdit: false,
        canInvite: false,
        canManageQA: false,
        canViewAudit: true,
        canManageUsers: false,
        canManageGroups: false,
        canManageRoom: false,
      };
    default:
      throw new Error(`Unknown role: ${role}`);
  }
}

export const register = baseProcedure
  .input(
    z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(8, "Password must be at least 8 characters"),
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      company: z.string().optional(),
      title: z.string().optional(),
      phone: z.string().optional(),
      invitationToken: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "User with this email already exists",
      });
    }

    // If invitation token is provided, validate it
    let invitation = null;
    if (input.invitationToken) {
      invitation = await db.invitation.findUnique({
        where: { 
          token: input.invitationToken,
          status: "PENDING",
        },
        include: {
          dataRoom: true,
        },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired invitation",
        });
      }

      if (invitation.expiresAt < new Date()) {
        await db.invitation.update({
          where: { id: invitation.id },
          data: { status: "EXPIRED" },
        });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invitation has expired",
        });
      }

      if (invitation.email.toLowerCase() !== input.email.toLowerCase()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email address does not match invitation",
        });
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(input.password);

    // Create user
    const user = await db.user.create({
      data: {
        email: input.email.toLowerCase(),
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        company: input.company,
        title: input.title,
        phone: input.phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        company: true,
        title: true,
        isEmailVerified: true,
      },
    });

    // If this was an invitation-based registration, grant access to the data room
    if (invitation) {
      // Determine permissions based on role
      const permissions = getPermissionsByRole(invitation.role);
      
      // Create user room access based on invitation
      await db.userRoomAccess.create({
        data: {
          userId: user.id,
          dataRoomId: invitation.dataRoomId,
          role: invitation.role,
          ...permissions,
        },
      });

      // Add user to specified groups
      if (invitation.groupIds && invitation.groupIds.length > 0) {
        await db.userGroupMembership.createMany({
          data: invitation.groupIds.map(groupId => ({
            userId: user.id,
            groupId: groupId,
          })),
          skipDuplicates: true,
        });
      }

      // Update invitation status
      await db.invitation.update({
        where: { id: invitation.id },
        data: { 
          status: "ACCEPTED",
          receiverId: user.id,
          acceptedAt: new Date(),
        },
      });

      // Log audit event for invitation acceptance
      await logAuditEvent({
        userId: user.id,
        action: "ACCEPT_INVITATION",
        resource: "ROOM",
        resourceId: invitation.dataRoomId,
        dataRoomId: invitation.dataRoomId,
        details: JSON.stringify({
          invitationId: invitation.id,
          role: invitation.role,
          groupIds: invitation.groupIds,
        }),
      });
    }

    // Generate JWT token
    const token = signJWT({ userId: user.id });

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      action: "REGISTER",
      resource: "USER",
      resourceId: user.id,
    });

    return {
      user,
      token,
    };
  });
