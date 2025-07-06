import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { authenticateUser } from "~/server/utils/auth";

export const getQuestions = baseProcedure
  .input(z.object({
    token: z.string(),
    dataRoomId: z.number(),
  }))
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);
    
    // Check if user has access to this data room
    const userAccess = await db.userRoomAccess.findFirst({
      where: {
        userId: user.id,
        dataRoomId: input.dataRoomId,
        canView: true,
      },
    });

    if (!userAccess) {
      throw new Error("You don't have access to this data room");
    }

    // Fetch questions - show private questions only to the author or admins
    const questions = await db.qAQuestion.findMany({
      where: {
        dataRoomId: input.dataRoomId,
        OR: [
          { isPrivate: false },
          { authorId: user.id },
          { 
            dataRoom: {
              userAccess: {
                some: {
                  userId: user.id,
                  canManageQA: true,
                },
              },
            },
          },
        ],
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        answers: {
          where: {
            OR: [
              { isPrivate: false },
              { authorId: user.id },
              { 
                question: {
                  dataRoom: {
                    userAccess: {
                      some: {
                        userId: user.id,
                        canManageQA: true,
                      },
                    },
                  },
                },
              },
            ],
          },
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return questions;
  });
