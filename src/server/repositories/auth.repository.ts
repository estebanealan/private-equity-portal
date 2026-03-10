import { and, desc, eq, isNull } from "drizzle-orm";

import { clientProfiles, users } from "@/db/schema";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export type AuthUserRecord = {
  userId: string;
  email: string;
  fullName: string;
  passwordHash: string | null;
  role: "super_admin" | "admin" | "client";
  clientProfileId?: string;
  mfaEnabled: boolean;
  mfaSecretEncrypted?: string;
};

function requireAuthDb() {
  if (!db) {
    throw new AppError("Database is not configured", "SERVICE_UNAVAILABLE", 503);
  }

  return db;
}

export async function findUserByEmail(email: string): Promise<AuthUserRecord | null> {
  const connection = requireAuthDb();

  try {
    const rows = await connection
      .select({
        userId: users.id,
        email: users.email,
        fullName: users.fullName,
        passwordHash: users.passwordHash,
        role: users.role,
        clientProfileId: clientProfiles.id,
        mfaEnabled: users.mfaEnabled,
        mfaSecretEncrypted: users.mfaSecretEncrypted,
      })
      .from(users)
      .leftJoin(clientProfiles, eq(clientProfiles.userId, users.id))
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .orderBy(desc(users.createdAt))
      .limit(1);

    const record = rows[0];
    if (!record) {
      return null;
    }

    return {
      userId: record.userId,
      email: record.email,
      fullName: record.fullName,
      passwordHash: record.passwordHash,
      role: record.role,
      ...(record.clientProfileId ? { clientProfileId: record.clientProfileId } : {}),
      mfaEnabled: record.mfaEnabled,
      ...(record.mfaSecretEncrypted ? { mfaSecretEncrypted: record.mfaSecretEncrypted } : {}),
    };
  } catch (error) {
    logger.error({ error, email }, "Auth lookup by email failed");
    throw new AppError("Authentication lookup failed", "INTERNAL_ERROR", 500);
  }
}

export async function findUserById(userId: string): Promise<AuthUserRecord | null> {
  const connection = requireAuthDb();

  try {
    const rows = await connection
      .select({
        userId: users.id,
        email: users.email,
        fullName: users.fullName,
        passwordHash: users.passwordHash,
        role: users.role,
        clientProfileId: clientProfiles.id,
        mfaEnabled: users.mfaEnabled,
        mfaSecretEncrypted: users.mfaSecretEncrypted,
      })
      .from(users)
      .leftJoin(clientProfiles, eq(clientProfiles.userId, users.id))
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .orderBy(desc(users.createdAt))
      .limit(1);

    const record = rows[0];
    if (!record) {
      return null;
    }

    return {
      userId: record.userId,
      email: record.email,
      fullName: record.fullName,
      passwordHash: record.passwordHash,
      role: record.role,
      ...(record.clientProfileId ? { clientProfileId: record.clientProfileId } : {}),
      mfaEnabled: record.mfaEnabled,
      ...(record.mfaSecretEncrypted ? { mfaSecretEncrypted: record.mfaSecretEncrypted } : {}),
    };
  } catch (error) {
    logger.error({ error, userId }, "Auth lookup by id failed");
    throw new AppError("Authentication lookup failed", "INTERNAL_ERROR", 500);
  }
}

export async function enableUserMfa(userId: string, mfaSecretEncrypted: string) {
  const connection = requireAuthDb();

  try {
    await connection
      .update(users)
      .set({
        mfaEnabled: true,
        mfaSecretEncrypted,
        mfaEnrolledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  } catch (error) {
    logger.error({ error, userId }, "Enabling MFA failed");
    throw new AppError("Unable to enable MFA", "INTERNAL_ERROR", 500);
  }
}

export async function touchUserLastLogin(userId: string) {
  const connection = requireAuthDb();

  try {
    await connection
      .update(users)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  } catch (error) {
    logger.warn({ error, userId }, "Failed to update last login timestamp");
  }
}
