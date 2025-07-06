import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { authenticateUser } from "~/server/utils/auth";

export const getAnalytics = baseProcedure
  .input(z.object({
    token: z.string(),
    dataRoomId: z.number().optional(),
    dateRange: z.object({
      from: z.date(),
      to: z.date(),
    }).optional(),
  }))
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);
    
    // Check if user has analytics access
    if (input.dataRoomId) {
      const userAccess = await db.userRoomAccess.findFirst({
        where: {
          userId: user.id,
          dataRoomId: input.dataRoomId,
          canViewAudit: true,
        },
      });

      if (!userAccess) {
        throw new Error("You don't have permission to view analytics for this data room");
      }
    }

    const whereClause: any = {};
    if (input.dataRoomId) {
      whereClause.dataRoomId = input.dataRoomId;
    }
    if (input.dateRange) {
      whereClause.timestamp = {
        gte: input.dateRange.from,
        lte: input.dateRange.to,
      };
    }

    // Get activity overview
    const activityOverview = await db.auditLog.groupBy({
      by: ['action'],
      where: whereClause,
      _count: {
        action: true,
      },
    });

    // Get daily activity
    const dailyActivity = await db.auditLog.findMany({
      where: whereClause,
      select: {
        timestamp: true,
        action: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 1000, // Limit for performance
    });

    // Get top viewed files
    const topViewedFiles = await db.auditLog.groupBy({
      by: ['fileId'],
      where: {
        ...whereClause,
        action: 'VIEW',
        fileId: { not: null },
      },
      _count: {
        fileId: true,
      },
      orderBy: {
        _count: {
          fileId: 'desc',
        },
      },
      take: 10,
    });

    // Get file details for top viewed files
    const fileIds = topViewedFiles.map(f => f.fileId).filter(Boolean) as number[];
    const fileDetails = await db.file.findMany({
      where: {
        id: { in: fileIds },
      },
      select: {
        id: true,
        name: true,
        size: true,
        mimeType: true,
      },
    });

    // Get user activity
    const userActivity = await db.auditLog.groupBy({
      by: ['userId'],
      where: whereClause,
      _count: {
        userId: true,
      },
      orderBy: {
        _count: {
          userId: 'desc',
        },
      },
      take: 10,
    });

    // Get user details for top active users
    const userIds = userActivity.map(u => u.userId).filter(Boolean) as number[];
    const userDetails = await db.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    return {
      activityOverview,
      dailyActivity,
      topViewedFiles: topViewedFiles.map(f => ({
        ...f,
        file: fileDetails.find(file => file.id === f.fileId),
      })),
      userActivity: userActivity.map(u => ({
        ...u,
        user: userDetails.find(user => user.id === u.userId),
      })),
    };
  });
