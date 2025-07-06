import { z } from "zod";
import { baseProcedure } from "../main";
import { authenticateUser, logAuditEvent } from "../../utils/auth";
import { db } from "../../db";

export const updateDataRoomSettings = baseProcedure
  .input(
    z.object({
      token: z.string(),
      dataRoomId: z.number(),
      category: z.enum(["SECURITY", "BRANDING", "ACCESS"]),
      settings: z.record(z.any()),
    })
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Verify user has admin access to the data room
    const userAccess = await db.userRoomAccess.findFirst({
      where: {
        userId: user.id,
        dataRoomId: input.dataRoomId,
        OR: [
          { role: "ADMIN" },
          { canEdit: true },
        ],
      },
    });

    if (!userAccess) {
      throw new Error("Access denied. Admin privileges required for this data room.");
    }

    // Prepare update data based on category
    let updateData: any = {};

    if (input.category === "SECURITY") {
      const {
        allowDownload,
        allowPrint,
        allowCopyPaste,
        watermarkEnabled,
        requireNDA,
        expiresAt,
        ipWhitelist,
        allowedCountries,
      } = input.settings;

      updateData = {
        allowDownload: allowDownload ?? undefined,
        allowPrint: allowPrint ?? undefined,
        allowCopyPaste: allowCopyPaste ?? undefined,
        watermarkEnabled: watermarkEnabled ?? undefined,
        requireNDA: requireNDA ?? undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      };

      // Update user access restrictions if provided
      if (ipWhitelist !== undefined || allowedCountries !== undefined) {
        await db.userRoomAccess.updateMany({
          where: { dataRoomId: input.dataRoomId },
          data: {
            ipWhitelist: ipWhitelist || [],
            allowedCountries: allowedCountries || [],
          },
        });
      }
    } else if (input.category === "BRANDING") {
      const { customLogo, customColors, customSubdomain } = input.settings;

      updateData = {
        customLogo: customLogo ?? undefined,
        customColors: customColors ?? undefined,
        customSubdomain: customSubdomain ?? undefined,
      };
    } else if (input.category === "ACCESS") {
      // Access settings are typically managed through user access records
      // This could include default role settings, auto-approval, etc.
      // For now, we'll just log the change
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Update data room if there are changes
    if (Object.keys(updateData).length > 0) {
      await db.dataRoom.update({
        where: { id: input.dataRoomId },
        data: updateData,
      });
    }

    await logAuditEvent({
      userId: user.id,
      action: "UPDATE_DATA_ROOM_SETTINGS",
      resource: "DATA_ROOM",
      resourceId: input.dataRoomId,
      dataRoomId: input.dataRoomId,
      details: {
        category: input.category,
        settings: input.settings,
      },
    });

    return { success: true };
  });
