import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const getUserGroups = baseProcedure
  .input(
    z.object({
      token: z.string(),
      dataRoomId: z.number(),
    })
  )
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Check if user has access to this data room
    const userAccess = await db.userRoomAccess.findUnique({
      where: {
        userId_dataRoomId: {
          userId: user.id,
          dataRoomId: input.dataRoomId,
        },
      },
    });

    if (!userAccess || !userAccess.canView) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't have access to this data room",
      });
    }

    // Fetch all groups for this data room
    const groups = await db.userGroup.findMany({
      where: {
        dataRoomId: input.dataRoomId,
      },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                company: true,
                title: true,
              },
            },
          },
        },
        permissions: {
          include: {
            folder: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            memberships: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return groups;
  });
