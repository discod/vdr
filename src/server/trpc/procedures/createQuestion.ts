import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { authenticateUser, logAuditEvent } from "~/server/utils/auth";

export const createQuestion = baseProcedure
  .input(z.object({
    token: z.string(),
    dataRoomId: z.number(),
    question: z.string(),
    context: z.string().optional(),
    isPrivate: z.boolean().default(false),
  }))
  .mutation(async ({ input }) => {
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

    // Create question
    const question = await db.qAQuestion.create({
      data: {
        question: input.question,
        context: input.context,
        isPrivate: input.isPrivate,
        dataRoomId: input.dataRoomId,
        authorId: user.id,
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
        },
      },
    });

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      action: 'CREATE',
      resource: 'QUESTION',
      resourceId: question.id,
      dataRoomId: input.dataRoomId,
      details: JSON.stringify({
        question: input.question,
        isPrivate: input.isPrivate,
      }),
    });

    return question;
  });
