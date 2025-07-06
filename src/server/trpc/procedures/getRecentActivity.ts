import { z } from "zod";
import { baseProcedure } from "../main";
import { authenticateUser } from "../../utils/auth";
import { db } from "../../db";

export const getRecentActivity = baseProcedure
  .input(
    z.object({
      token: z.string(),
      limit: z.number().min(1).max(50).default(20),
      dataRoomId: z.number().optional(),
    })
  )
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Get accessible data rooms
    const accessibleRooms = await db.userRoomAccess.findMany({
      where: {
        userId: user.id,
        canView: true,
      },
      select: {
        dataRoomId: true,
      },
    });

    const dataRoomIds = accessibleRooms.map(access => access.dataRoomId);
    
    if (dataRoomIds.length === 0) {
      return [];
    }

    // Build where clause
    const whereClause: any = {
      dataRoomId: {
        in: input.dataRoomId ? [input.dataRoomId] : dataRoomIds,
      },
      action: {
        in: ["UPLOAD", "CREATE", "ANSWER", "INVITE", "VIEW"],
      },
    };

    // Get recent activity
    const recentActivity = await db.auditLog.findMany({
      where: whereClause,
      orderBy: {
        timestamp: "desc",
      },
      take: input.limit,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        dataRoom: {
          select: {
            name: true,
          },
        },
        file: {
          select: {
            name: true,
            mimeType: true,
          },
        },
      },
    });

    // Transform the data for better frontend consumption
    const transformedActivity = recentActivity.map(activity => ({
      id: activity.id,
      action: activity.action,
      resource: activity.resource,
      timestamp: activity.timestamp,
      user: activity.user,
      dataRoom: activity.dataRoom,
      file: activity.file,
      details: activity.details ? JSON.parse(activity.details) : null,
      description: generateActivityDescription(activity),
    }));

    return transformedActivity;
  });

function generateActivityDescription(activity: any): string {
  const userName = `${activity.user?.firstName} ${activity.user?.lastName}`;
  
  switch (activity.action) {
    case "UPLOAD":
      return `${userName} uploaded ${activity.file?.name || 'a file'}`;
    case "CREATE":
      if (activity.resource === "QUESTION") {
        return `${userName} asked a new question`;
      }
      return `${userName} created ${activity.resource.toLowerCase()}`;
    case "ANSWER":
      return `${userName} answered a question`;
    case "INVITE":
      return `${userName} invited a new user`;
    case "VIEW":
      if (activity.file?.name) {
        return `${userName} viewed ${activity.file.name}`;
      }
      return `${userName} accessed the data room`;
    default:
      return `${userName} performed ${activity.action.toLowerCase()}`;
  }
}
