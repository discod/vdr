import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser, logAuditEvent } from "~/server/utils/auth";

export const manageUserGroupMembership = baseProcedure
  .input(
    z.object({
      token: z.string(),
      dataRoomId: z.number(),
      groupId: z.number(),
      userId: z.number(),
      action: z.enum(["ADD", "REMOVE"]),
    })
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Check if user has permission to manage groups
    const userAccess = await db.userRoomAccess.findUnique({
      where: {
        userId_dataRoomId: {
          userId: user.id,
          dataRoomId: input.dataRoomId,
        },
      },
    });

    if (!userAccess || (!userAccess.canManageGroups && !userAccess.canManageUsers && userAccess.role !== "ROOM_OWNER")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't have permission to manage group memberships",
      });
    }

    // Verify the group belongs to this data room
    const group = await db.userGroup.findFirst({
      where: {
        id: input.groupId,
        dataRoomId: input.dataRoomId,
      },
    });

    if (!group) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Group not found in this data room",
      });
    }

    // Verify the target user has access to this data room
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
        code: "BAD_REQUEST",
        message: "Target user does not have access to this data room",
      });
    }

    if (input.action === "ADD") {
      // Add user to group
      try {
        await db.userGroupMembership.create({
          data: {
            userId: input.userId,
            groupId: input.groupId,
          },
        });
      } catch (error) {
        // Handle duplicate membership gracefully
        if (error.code === "P2002") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "User is already a member of this group",
          });
        }
        throw error;
      }
    } else {
      // Remove user from group
      const membership = await db.userGroupMembership.findUnique({
        where: {
          userId_groupId: {
            userId: input.userId,
            groupId: input.groupId,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User is not a member of this group",
        });
      }

      await db.userGroupMembership.delete({
        where: {
          id: membership.id,
        },
      });
    }

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      action: input.action === "ADD" ? "ADD_TO_GROUP" : "REMOVE_FROM_GROUP",
      resource: "GROUP",
      resourceId: input.groupId,
      dataRoomId: input.dataRoomId,
      details: JSON.stringify({
        targetUserId: input.userId,
        groupName: group.name,
      }),
    });

    return { success: true };
  });
