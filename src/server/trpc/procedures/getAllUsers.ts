import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { authenticateUser } from "~/server/utils/auth";

export const getAllUsers = baseProcedure
  .input(z.object({
    token: z.string(),
    page: z.number().default(1),
    limit: z.number().default(50),
    search: z.string().optional(),
  }))
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);
    
    // Check if user is master admin (for now, check if user has admin access to any room)
    const adminAccess = await db.userRoomAccess.findFirst({
      where: {
        userId: user.id,
        role: 'ADMIN',
      },
    });

    if (!adminAccess) {
      throw new Error("You don't have permission to view all users");
    }

    const skip = (input.page - 1) * input.limit;
    const whereClause: any = {};
    
    if (input.search) {
      whereClause.OR = [
        { firstName: { contains: input.search, mode: 'insensitive' } },
        { lastName: { contains: input.search, mode: 'insensitive' } },
        { email: { contains: input.search, mode: 'insensitive' } },
        { company: { contains: input.search, mode: 'insensitive' } },
      ];
    }

    const [users, totalCount] = await Promise.all([
      db.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          company: true,
          title: true,
          phone: true,
          isActive: true,
          isEmailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          _count: {
            select: {
              userRoomAccess: true,
              createdRooms: true,
            },
          },
        },
        skip,
        take: input.limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      db.user.count({ where: whereClause }),
    ]);

    return {
      users,
      totalCount,
      totalPages: Math.ceil(totalCount / input.limit),
      currentPage: input.page,
    };
  });
