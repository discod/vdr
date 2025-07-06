import { z } from "zod";
import { baseProcedure } from "../main";
import { authenticateUser, logAuditEvent } from "../../utils/auth";
import { db } from "../../db";

export const updateSystemSettings = baseProcedure
  .input(
    z.object({
      token: z.string(),
      category: z.enum(["SMTP", "SECURITY", "BRANDING"]),
      settings: z.record(z.any()),
    })
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Check if user is super admin (has admin access to any data room)
    const adminAccess = await db.userRoomAccess.findFirst({
      where: {
        userId: user.id,
        role: "ADMIN",
      },
    });

    if (!adminAccess) {
      throw new Error("Access denied. Super admin privileges required.");
    }

    // Sensitive keys that should be encrypted
    const sensitiveKeys = ['password', 'secret', 'key', 'token'];

    // Update each setting
    for (const [key, value] of Object.entries(input.settings)) {
      const isEncrypted = sensitiveKeys.some(sensitiveKey => 
        key.toLowerCase().includes(sensitiveKey)
      );

      let stringValue = value;
      if (typeof value === 'object' && value !== null) {
        stringValue = JSON.stringify(value);
      } else if (typeof value !== 'string') {
        stringValue = String(value);
      }

      await db.systemSettings.upsert({
        where: {
          key: `${input.category}_${key}`,
        },
        update: {
          value: stringValue,
          isEncrypted,
          updatedAt: new Date(),
        },
        create: {
          key: `${input.category}_${key}`,
          value: stringValue,
          category: input.category,
          isEncrypted,
          description: `${input.category} setting: ${key}`,
        },
      });
    }

    await logAuditEvent({
      userId: user.id,
      action: "UPDATE_SYSTEM_SETTINGS",
      resource: "SYSTEM",
      details: { 
        category: input.category,
        keys: Object.keys(input.settings)
      },
    });

    return { success: true };
  });
