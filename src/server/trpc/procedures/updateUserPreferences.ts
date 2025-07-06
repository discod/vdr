import { z } from "zod";
import { baseProcedure } from "../main";
import { authenticateUser, logAuditEvent } from "../../utils/auth";
import { db } from "../../db";

export const updateUserPreferences = baseProcedure
  .input(
    z.object({
      token: z.string(),
      theme: z.enum(["light", "dark", "system"]).optional(),
      language: z.string().optional(),
      timezone: z.string().optional(),
      emailNotifications: z.boolean().optional(),
      browserNotifications: z.boolean().optional(),
      sessionTimeout: z.number().min(5).max(480).optional(),
    })
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);
    const { token, ...updateData } = input;

    // Update user preferences
    const preferences = await db.userPreferences.upsert({
      where: { userId: user.id },
      update: updateData,
      create: {
        userId: user.id,
        theme: input.theme || "light",
        language: input.language || "en",
        timezone: input.timezone || "UTC",
        emailNotifications: input.emailNotifications ?? true,
        browserNotifications: input.browserNotifications ?? false,
        sessionTimeout: input.sessionTimeout || 30,
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: "UPDATE_USER_PREFERENCES",
      resource: "USER",
      details: { updatedFields: Object.keys(updateData) },
    });

    return preferences;
  });
