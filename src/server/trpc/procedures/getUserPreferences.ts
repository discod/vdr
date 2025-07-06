import { z } from "zod";
import { baseProcedure } from "../main";
import { authenticateUser } from "../../utils/auth";
import { db } from "../../db";

export const getUserPreferences = baseProcedure
  .input(
    z.object({
      token: z.string(),
    })
  )
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Get user preferences, create default if doesn't exist
    let preferences = await db.userPreferences.findUnique({
      where: { userId: user.id },
    });

    if (!preferences) {
      preferences = await db.userPreferences.create({
        data: {
          userId: user.id,
          theme: "light",
          language: "en",
          timezone: "UTC",
          emailNotifications: true,
          browserNotifications: false,
          twoFactorEnabled: false,
          sessionTimeout: 30,
        },
      });
    }

    return preferences;
  });
