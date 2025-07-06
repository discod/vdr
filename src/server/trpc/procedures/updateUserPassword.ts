import { z } from "zod";
import { baseProcedure } from "../main";
import { authenticateUser, logAuditEvent, verifyPassword, hashPassword } from "../../utils/auth";
import { db } from "../../db";

export const updateUserPassword = baseProcedure
  .input(
    z.object({
      token: z.string(),
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8),
    })
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Get user with password for verification
    const userWithPassword = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, password: true },
    });

    if (!userWithPassword) {
      throw new Error("User not found");
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(
      input.currentPassword,
      userWithPassword.password
    );

    if (!isCurrentPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(input.newPassword);

    // Update password
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    });

    await logAuditEvent({
      userId: user.id,
      action: "UPDATE_PASSWORD",
      resource: "USER",
      details: { action: "password_changed" },
    });

    return { success: true };
  });
