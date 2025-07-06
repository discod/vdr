import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { verifyPassword, signJWT, logAuditEvent } from "~/server/utils/auth";

export const login = baseProcedure
  .input(
    z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(1, "Password is required"),
      ipAddress: z.string().optional(),
      userAgent: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    // Find user by email
    const user = await db.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid email or password",
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(input.password, user.password);
    if (!isValidPassword) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid email or password",
      });
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate JWT token
    const token = signJWT({ userId: user.id });

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      action: "LOGIN",
      resource: "USER",
      resourceId: user.id,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company,
        title: user.title,
        isEmailVerified: user.isEmailVerified,
      },
      token,
    };
  });
