import { z } from "zod";
import { baseProcedure } from "../main";
import { authenticateUser } from "../../utils/auth";
import { db } from "../../db";

export const getAccessRequests = baseProcedure
  .input(
    z.object({
      token: z.string(),
      dataRoomId: z.number(),
      status: z.enum(["PENDING", "APPROVED", "DENIED"]).optional(),
    })
  )
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Check if user has permission to manage this data room
    const userAccess = await db.userRoomAccess.findFirst({
      where: {
        userId: user.id,
        dataRoomId: input.dataRoomId,
        canEdit: true,
      },
    });

    if (!userAccess) {
      throw new Error("You don't have permission to view access requests for this data room");
    }

    // Build where clause
    const whereClause: any = {
      dataRoomId: input.dataRoomId,
    };

    if (input.status) {
      whereClause.status = input.status;
    }

    // Get access requests
    const accessRequests = await db.accessRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            company: true,
          },
        },
        folder: {
          select: {
            name: true,
          },
        },
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return accessRequests;
  });
