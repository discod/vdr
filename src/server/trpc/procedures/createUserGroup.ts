import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser, logAuditEvent } from "~/server/utils/auth";

export const createUserGroup = baseProcedure
  .input(
    z.object({
      token: z.string(),
      dataRoomId: z.number(),
      name: z.string().min(1, "Group name is required"),
      description: z.string().optional(),
      color: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Check if user has permission to manage groups in this data room
    const userAccess = await db.userRoomAccess.findUnique({
      where: {
        userId_dataRoomId: {
          userId: user.id,
          dataRoomId: input.dataRoomId,
        },
      },
    });

    if (!userAccess || (!userAccess.canManageGroups && userAccess.role !== "ROOM_OWNER")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't have permission to manage groups in this data room",
      });
    }

    // Check if group name already exists in this data room
    const existingGroup = await db.userGroup.findFirst({
      where: {
        dataRoomId: input.dataRoomId,
        name: input.name,
      },
    });

    if (existingGroup) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "A group with this name already exists in this data room",
      });
    }

    // Create the user group
    const group = await db.userGroup.create({
      data: {
        name: input.name,
        description: input.description,
        dataRoomId: input.dataRoomId,
        color: input.color,
      },
    });

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      action: "CREATE",
      resource: "GROUP",
      resourceId: group.id,
      dataRoomId: input.dataRoomId,
      details: JSON.stringify({
        groupName: input.name,
        description: input.description,
      }),
    });

    return group;
  });
