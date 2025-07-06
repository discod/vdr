import { z } from "zod";
import { baseProcedure } from "../main";
import { authenticateUser, logAuditEvent } from "../../utils/auth";
import { db } from "../../db";

export const updateUserProfile = baseProcedure
  .input(
    z.object({
      token: z.string(),
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      email: z.string().email().optional(),
      company: z.string().optional(),
      title: z.string().optional(),
      phone: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);
    const { token, ...updateData } = input;

    // Check if email is being changed and if it's already taken
    if (input.email && input.email !== user.email) {
      const existingUser = await db.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new Error("Email address is already in use");
      }
    }

    // Update user profile
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        company: true,
        title: true,
        phone: true,
        isEmailVerified: true,
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: "UPDATE_USER_PROFILE",
      resource: "USER",
      details: { updatedFields: Object.keys(updateData) },
    });

    return updatedUser;
  });
