import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { authenticateUser, logAuditEvent } from "~/server/utils/auth";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

export const impersonateUser = baseProcedure
  .input(z.object({
    token: z.string(),
    targetUserId: z.number(),
  }))
  .mutation(async ({ input }) => {
    const adminUser = await authenticateUser(input.token);
    
    // Check if user is master admin
    const adminAccess = await db.userRoomAccess.findFirst({
      where: {
        userId: adminUser.id,
        role: 'ADMIN',
      },
    });

    if (!adminAccess) {
      throw new Error("You don't have permission to impersonate users");
    }

    // Get target user
    const targetUser = await db.user.findUnique({
      where: { id: input.targetUserId },
    });

    if (!targetUser) {
      throw new Error("Target user not found");
    }

    // Generate new JWT token for target user
    const impersonationToken = jwt.sign(
      { userId: targetUser.id, impersonatedBy: adminUser.id },
      env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Create session record
    await db.userSession.create({
      data: {
        userId: targetUser.id,
        token: impersonationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Log audit event
    await logAuditEvent({
      userId: adminUser.id,
      action: 'IMPERSONATE',
      resource: 'USER',
      resourceId: targetUser.id,
      details: JSON.stringify({
        targetUserId: targetUser.id,
        targetUserEmail: targetUser.email,
        impersonatedBy: adminUser.id,
        impersonatedByEmail: adminUser.email,
      }),
    });

    return {
      token: impersonationToken,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        company: targetUser.company,
        title: targetUser.title,
        isImpersonated: true,
        impersonatedBy: {
          id: adminUser.id,
          email: adminUser.email,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
        },
      },
    };
  });
