import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser, logAuditEvent } from "~/server/utils/auth";

export const getDataRoom = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      roomId: z.number(),
    })
  )
  .query(async ({ input }) => {
    const user = await authenticateUser(input.authToken);

    // Check if user has access to this room
    const userAccess = await db.userRoomAccess.findUnique({
      where: {
        userId_dataRoomId: {
          userId: user.id,
          dataRoomId: input.roomId,
        },
      },
    });

    if (!userAccess || !userAccess.canView) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Access denied to this data room",
      });
    }

    // Get room details
    const dataRoom = await db.dataRoom.findUnique({
      where: { id: input.roomId },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        folders: {
          orderBy: { name: "asc" },
          include: {
            _count: {
              select: { files: true },
            },
          },
        },
        files: {
          where: { folderId: null }, // Root level files
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            size: true,
            mimeType: true,
            uploadedAt: true,
            uploader: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        userAccess: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                company: true,
              },
            },
          },
        },
        _count: {
          select: {
            files: true,
            folders: true,
            userAccess: true,
          },
        },
      },
    });

    if (!dataRoom) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Data room not found",
      });
    }

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      action: "VIEW",
      resource: "ROOM",
      resourceId: dataRoom.id,
      dataRoomId: dataRoom.id,
    });

    return {
      ...dataRoom,
      userPermissions: userAccess,
    };
  });
