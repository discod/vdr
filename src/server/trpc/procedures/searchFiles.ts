import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { authenticateUser } from "~/server/utils/auth";

export const searchFiles = baseProcedure
  .input(z.object({
    token: z.string(),
    query: z.string(),
    dataRoomId: z.number().optional(),
    mimeTypes: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    page: z.number().default(1),
    limit: z.number().default(20),
  }))
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

    const accessibleRoomIds = accessibleRooms.map(r => r.dataRoomId);

    if (accessibleRoomIds.length === 0) {
      return {
        files: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: input.page,
      };
    }

    const skip = (input.page - 1) * input.limit;
    const whereClause: any = {
      dataRoomId: { in: accessibleRoomIds },
    };

    // Add data room filter if specified
    if (input.dataRoomId) {
      if (!accessibleRoomIds.includes(input.dataRoomId)) {
        throw new Error("You don't have access to this data room");
      }
      whereClause.dataRoomId = input.dataRoomId;
    }

    // Add mime type filter
    if (input.mimeTypes && input.mimeTypes.length > 0) {
      whereClause.mimeType = { in: input.mimeTypes };
    }

    // Add tag filter
    if (input.tags && input.tags.length > 0) {
      whereClause.tags = { hasSome: input.tags };
    }

    // Add search query
    if (input.query) {
      whereClause.OR = [
        { name: { contains: input.query, mode: 'insensitive' } },
        { originalName: { contains: input.query, mode: 'insensitive' } },
        { ocrText: { contains: input.query, mode: 'insensitive' } },
        { tags: { hasSome: [input.query] } },
      ];
    }

    const [files, totalCount] = await Promise.all([
      db.file.findMany({
        where: whereClause,
        include: {
          uploader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          dataRoom: {
            select: {
              id: true,
              name: true,
            },
          },
          folder: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip,
        take: input.limit,
        orderBy: {
          uploadedAt: 'desc',
        },
      }),
      db.file.count({ where: whereClause }),
    ]);

    return {
      files,
      totalCount,
      totalPages: Math.ceil(totalCount / input.limit),
      currentPage: input.page,
    };
  });
