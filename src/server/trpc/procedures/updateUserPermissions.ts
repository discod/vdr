import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser, logAuditEvent } from "~/server/utils/auth";

export const updateUserPermissions = baseProcedure
  .input(
    z.object({
      token: z.string(),
      dataRoomId: z.number(),
      userId: z.number(),
      role: z.enum(["ADMIN", "CONTRIBUTOR", "VIEWER", "AUDITOR"]).optional(),
      permissions: z.object({
        canView: z.boolean().optional(),
        canDownload: z.boolean().optional(),
        canPrint: z.boolean().optional(),
        canUpload: z.boolean().optional(),
        canEdit: z.boolean().optional(),
        canInvite: z.boolean().optional(),
        canManageQA: z.boolean().optional(),
        canViewAudit: z.boolean().optional(),
        canManageUsers: z.boolean().optional(),
        canManageGroups: z.boolean().optional(),
        canManageRoom: z.boolean().optional(),
      }).optional(),
      accessRestrictions: z.object({
        ipWhitelist: z.array(z.string()).optional(),
        allowedCountries: z.array(z.string()).optional(),
        expiresAt: z.date().optional(),
      }).optional(),
    })
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Check if user has permission to manage users
    const userAccess = await db.userRoomAccess.findUnique({
      where: {
        userId_dataRoomId: {
          userId: user.id,
          dataRoomId: input.dataRoomId,
        },
      },
    });

    if (!userAccess || (!userAccess.canManageUsers && userAccess.role !== "ROOM_OWNER")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't have permission to manage user permissions",
      });
    }

    // Get the target user's current access
    const targetUserAccess = await db.userRoomAccess.findUnique({
      where: {
        userId_dataRoomId: {
          userId: input.userId,
          dataRoomId: input.dataRoomId,
        },
      },
    });

    if (!targetUserAccess) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User does not have access to this data room",
      });
    }

    // Prevent non-room-owners from modifying room owner permissions
    if (targetUserAccess.role === "ROOM_OWNER" && userAccess.role !== "ROOM_OWNER") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only room owners can modify room owner permissions",
      });
    }

    // Prevent users from changing their own role to ROOM_OWNER
    if (input.role === "ROOM_OWNER" || (input.userId === user.id && userAccess.role !== "ROOM_OWNER")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Cannot modify room owner role or your own permissions",
      });
    }

    // Build update data
    const updateData: any = {};
    
    if (input.role) {
      updateData.role = input.role;
    }
    
    if (input.permissions) {
      Object.assign(updateData, input.permissions);
    }
    
    if (input.accessRestrictions) {
      if (input.accessRestrictions.ipWhitelist !== undefined) {
        updateData.ipWhitelist = input.accessRestrictions.ipWhitelist;
      }
      if (input.accessRestrictions.allowedCountries !== undefined) {
        updateData.allowedCountries = input.accessRestrictions.allowedCountries;
      }
      if (input.accessRestrictions.expiresAt !== undefined) {
        updateData.expiresAt = input.accessRestrictions.expiresAt;
      }
    }

    // Update user permissions
    const updatedAccess = await db.userRoomAccess.update({
      where: {
        userId_dataRoomId: {
          userId: input.userId,
          dataRoomId: input.dataRoomId,
        },
      },
      data: updateData,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      action: "UPDATE_PERMISSIONS",
      resource: "USER",
      resourceId: input.userId,
      dataRoomId: input.dataRoomId,
      details: JSON.stringify({
        targetUser: updatedAccess.user,
        changes: updateData,
        previousRole: targetUserAccess.role,
      }),
    });

    return updatedAccess;
  });
