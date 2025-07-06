import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { hashPassword, signJWT, logAuditEvent } from "~/server/utils/auth";

export const register = baseProcedure
  .input(
    z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(8, "Password must be at least 8 characters"),
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      company: z.string().optional(),
      title: z.string().optional(),
      phone: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "User with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(input.password);

    // Create user
    const user = await db.user.create({
      data: {
        email: input.email.toLowerCase(),
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        company: input.company,
        title: input.title,
        phone: input.phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        company: true,
        title: true,
        isEmailVerified: true,
      },
    });

    // Generate JWT token
    const token = signJWT({ userId: user.id });

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      action: "REGISTER",
      resource: "USER",
      resourceId: user.id,
    });

    return {
      user,
      token,
    };
  });
