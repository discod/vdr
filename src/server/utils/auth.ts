import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { env } from "../env";
import { db } from "../db";

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export function signJWT(payload: { userId: number }): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "30d" });
}

export function verifyJWT(token: string): { userId: number } {
  try {
    const verified = jwt.verify(token, env.JWT_SECRET);
    return z.object({ userId: z.number() }).parse(verified);
  } catch (error) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired token",
    });
  }
}

export async function authenticateUser(authToken: string) {
  const { userId } = verifyJWT(authToken);
  
  const user = await db.user.findUnique({
    where: { id: userId, isActive: true },
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

  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User not found or inactive",
    });
  }

  return user;
}

export async function logAuditEvent({
  userId,
  action,
  resource,
  resourceId,
  dataRoomId,
  fileId,
  details,
  ipAddress,
  userAgent,
}: {
  userId?: number;
  action: string;
  resource: string;
  resourceId?: number;
  dataRoomId?: number;
  fileId?: number;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  await db.auditLog.create({
    data: {
      userId,
      action,
      resource,
      resourceId,
      dataRoomId,
      fileId,
      details: details ? JSON.stringify(details) : null,
      ipAddress,
      userAgent,
    },
  });
}
