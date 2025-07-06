import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser, logAuditEvent } from "~/server/utils/auth";

export const createDataRoom = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      name: z.string().min(1, "Room name is required"),
      description: z.string().optional(),
      type: z.enum(["M&A", "FUNDRAISING", "IPO", "AUDIT", "LEGAL", "CUSTOM"]),
      templateId: z.number().optional(),
      expiresAt: z.date().optional(),
      settings: z.object({
        allowDownload: z.boolean().default(true),
        allowPrint: z.boolean().default(true),
        allowCopyPaste: z.boolean().default(false),
        watermarkEnabled: z.boolean().default(true),
        requireNDA: z.boolean().default(false),
      }).optional(),
    })
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.authToken);

    // Create the data room
    const dataRoom = await db.dataRoom.create({
      data: {
        name: input.name,
        description: input.description,
        type: input.type,
        expiresAt: input.expiresAt,
        creatorId: user.id,
        allowDownload: input.settings?.allowDownload ?? true,
        allowPrint: input.settings?.allowPrint ?? true,
        allowCopyPaste: input.settings?.allowCopyPaste ?? false,
        watermarkEnabled: input.settings?.watermarkEnabled ?? true,
        requireNDA: input.settings?.requireNDA ?? false,
      },
    });

    // Give the creator ROOM_OWNER access with full permissions
    await db.userRoomAccess.create({
      data: {
        userId: user.id,
        dataRoomId: dataRoom.id,
        role: "ROOM_OWNER",
        canView: true,
        canDownload: true,
        canPrint: true,
        canUpload: true,
        canEdit: true,
        canInvite: true,
        canManageQA: true,
        canViewAudit: true,
        canManageUsers: true,
        canManageGroups: true,
        canManageRoom: true,
      },
    });

    // If a template is specified, create the folder structure
    if (input.templateId) {
      const template = await db.roomTemplate.findUnique({
        where: { id: input.templateId },
      });

      if (template) {
        const structure = JSON.parse(template.structure);
        await createFolderStructure(dataRoom.id, structure.folders);
      }
    }

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      action: "CREATE",
      resource: "ROOM",
      resourceId: dataRoom.id,
      dataRoomId: dataRoom.id,
      details: { name: input.name, type: input.type },
    });

    return dataRoom;
  });

async function createFolderStructure(dataRoomId: number, folders: any[], parentId?: number) {
  for (const folderDef of folders) {
    const folder = await db.folder.create({
      data: {
        name: folderDef.name,
        dataRoomId,
        parentId,
      },
    });

    // Create subfolders if they exist
    if (folderDef.children && Array.isArray(folderDef.children)) {
      const subfolders = folderDef.children.map((child: string) => ({ name: child }));
      await createFolderStructure(dataRoomId, subfolders, folder.id);
    }
  }
}
