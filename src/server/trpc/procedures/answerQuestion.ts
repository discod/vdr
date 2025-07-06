import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { authenticateUser, logAuditEvent } from "~/server/utils/auth";

export const answerQuestion = baseProcedure
  .input(z.object({
    token: z.string(),
    questionId: z.number(),
    answer: z.string(),
    isPrivate: z.boolean().default(false),
  }))
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);
    
    // Get the question and check permissions
    const question = await db.qAQuestion.findUnique({
      where: { id: input.questionId },
      include: {
        dataRoom: {
          include: {
            userAccess: {
              where: { userId: user.id },
            },
          },
        },
      },
    });

    if (!question) {
      throw new Error("Question not found");
    }

    const userAccess = question.dataRoom.userAccess[0];
    if (!userAccess || (!userAccess.canManageQA && !userAccess.canView)) {
      throw new Error("You don't have permission to answer questions in this data room");
    }

    // Create answer
    const answer = await db.qAAnswer.create({
      data: {
        answer: input.answer,
        isPrivate: input.isPrivate,
        questionId: input.questionId,
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
      },
    });

    // Update question status to ANSWERED
    await db.qAQuestion.update({
      where: { id: input.questionId },
      data: { status: 'ANSWERED' },
    });

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      action: 'CREATE',
      resource: 'ANSWER',
      resourceId: answer.id,
      dataRoomId: question.dataRoomId,
      details: JSON.stringify({
        questionId: input.questionId,
        isPrivate: input.isPrivate,
      }),
    });

    return answer;
  });
