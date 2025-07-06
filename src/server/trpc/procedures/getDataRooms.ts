import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const getDataRooms = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      cursor: z.number().optional(),
      limit: z.number().min(1).max(100).default(20),
      status: z.enum(["ACTIVE", "ARCHIVED", "EXPIRED"]).optional(),
      type: z.enum(["M&A", "FUNDRAISING", "IPO", "AUDIT", "LEGAL", "CUSTOM"]).optional(),
    })
  )
  .query(async ({ input }) => {
    const user = await authenticateUser(input.authToken);

    const where = {
      userAccess: {
        some: {
          userId: user.id,
        },
      },
      ...(input.status && { status: input.status }),
      ...(input.type && { type: input.type }),
    };

    const dataRooms = await db.dataRoom.findMany({
      where,
      take: input.limit + 1,
      skip: input.cursor ? 1 : 0,
      cursor: input.cursor ? { id: input.cursor } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        status: true,
        createdAt: true,
        expiresAt: true,
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        userAccess: {
          where: { userId: user.id },
          select: {
            role: true,
            canView: true,
            canDownload: true,
            canUpload: true,
            canEdit: true,
            canInvite: true,
            canManageQA: true,
            canViewAudit: true,
          },
        },
        _count: {
          select: {
            files: true,
            folders: true,
            userAccess: true,
          },
        },
      },
    });

    let nextCursor: number | undefined = undefined;
    if (dataRooms.length > input.limit) {
      const nextItem = dataRooms.pop();
      nextCursor = nextItem!.id;
    }

    return {
      dataRooms: dataRooms.map((room) => ({
        ...room,
        userRole: room.userAccess[0]?.role || "VIEWER",
        permissions: room.userAccess[0] || {},
      })),
      nextCursor,
    };
  });
