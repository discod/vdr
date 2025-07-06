import { z } from "zod";
import { baseProcedure } from "../main";
import { authenticateUser, logAuditEvent } from "../../utils/auth";
import { db } from "../../db";

export const getSystemSettings = baseProcedure
  .input(
    z.object({
      token: z.string(),
    })
  )
  .query(async ({ input }) => {
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

    // Fetch all system settings
    const settings = await db.systemSettings.findMany({
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ],
    });

    // Group settings by category
    const groupedSettings: Record<string, Record<string, any>> = {};
    
    for (const setting of settings) {
      if (!groupedSettings[setting.category.toLowerCase()]) {
        groupedSettings[setting.category.toLowerCase()] = {};
      }
      
      // Parse JSON values if they exist
      let value = setting.value;
      if (value && (value.startsWith('{') || value.startsWith('['))) {
        try {
          value = JSON.parse(value);
        } catch {
          // Keep as string if not valid JSON
        }
      }
      
      groupedSettings[setting.category.toLowerCase()][setting.key] = value;
    }

    await logAuditEvent({
      userId: user.id,
      action: "VIEW_SYSTEM_SETTINGS",
      resource: "SYSTEM",
      details: { categories: Object.keys(groupedSettings) },
    });

    return groupedSettings;
  });
