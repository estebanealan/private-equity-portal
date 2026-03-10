import { asc, desc, eq } from "drizzle-orm";

import { assets, clientProfiles, movements, users } from "@/db/schema";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { CreateMovementInput } from "@/server/schemas/movement";

export type MovementListItem = {
  id: string;
  clientProfileId: string;
  clientCode: string;
  assetId: string;
  assetName: string;
  direction: "inflow" | "outflow" | "transfer";
  amountUsd: number;
  effectiveAt: string;
  notes?: string;
  recordedByName: string;
};

export type MovementClientOption = {
  clientProfileId: string;
  clientCode: string;
};

export type MovementAssetOption = {
  assetId: string;
  assetName: string;
};

function requireMovementDb() {
  if (!db) {
    throw new AppError("Database is not configured", "SERVICE_UNAVAILABLE", 503);
  }

  return db;
}

export async function listMovements(clientProfileId?: string): Promise<MovementListItem[]> {
  const connection = requireMovementDb();

  try {
    const query = connection
      .select({
        id: movements.id,
        clientProfileId: movements.clientProfileId,
        clientCode: clientProfiles.publicCode,
        assetId: assets.id,
        assetName: assets.name,
        direction: movements.direction,
        amountUsd: movements.amountUsd,
        effectiveAt: movements.effectiveAt,
        notes: movements.notes,
        recordedByName: users.fullName,
      })
      .from(movements)
      .innerJoin(clientProfiles, eq(clientProfiles.id, movements.clientProfileId))
      .innerJoin(assets, eq(assets.id, movements.assetId))
      .innerJoin(users, eq(users.id, movements.recordedByUserId))
      .orderBy(desc(movements.effectiveAt));

    const rows = clientProfileId
      ? await query.where(eq(movements.clientProfileId, clientProfileId))
      : await query;

    return rows.map((row) => ({
      id: row.id,
      clientProfileId: row.clientProfileId,
      clientCode: row.clientCode,
      assetId: row.assetId,
      assetName: row.assetName,
      direction: row.direction,
      amountUsd: Number(row.amountUsd),
      effectiveAt: row.effectiveAt.toISOString(),
      ...(row.notes ? { notes: row.notes } : {}),
      recordedByName: row.recordedByName,
    }));
  } catch (error) {
    logger.error({ error, clientProfileId }, "Loading movements from database failed");
    throw new AppError("Unable to list movements", "INTERNAL_ERROR", 500);
  }
}

export async function listMovementClients(): Promise<MovementClientOption[]> {
  const connection = requireMovementDb();

  try {
    const rows = await connection
      .select({
        clientProfileId: clientProfiles.id,
        clientCode: clientProfiles.publicCode,
      })
      .from(clientProfiles)
      .orderBy(asc(clientProfiles.publicCode));

    return rows;
  } catch (error) {
    logger.error({ error }, "Loading movement client options failed");
    throw new AppError("Unable to load client options", "INTERNAL_ERROR", 500);
  }
}

export async function listMovementAssets(): Promise<MovementAssetOption[]> {
  const connection = requireMovementDb();

  try {
    const rows = await connection
      .select({
        assetId: assets.id,
        assetName: assets.name,
      })
      .from(assets)
      .orderBy(asc(assets.name));

    return rows;
  } catch (error) {
    logger.error({ error }, "Loading movement asset options failed");
    throw new AppError("Unable to load asset options", "INTERNAL_ERROR", 500);
  }
}

export async function createMovement(input: CreateMovementInput, recordedByUserId: string) {
  const connection = requireMovementDb();

  try {
    const inserted = await connection
      .insert(movements)
      .values({
        clientProfileId: input.clientProfileId,
        assetId: input.assetId,
        direction: input.direction,
        amountUsd: input.amountUsd.toFixed(2),
        effectiveAt: new Date(input.effectiveAt),
        notes: input.notes,
        recordedByUserId,
      })
      .returning({
        id: movements.id,
        clientProfileId: movements.clientProfileId,
        assetId: movements.assetId,
        direction: movements.direction,
        amountUsd: movements.amountUsd,
        effectiveAt: movements.effectiveAt,
        notes: movements.notes,
      });

    const created = inserted[0];
    if (!created) {
      throw new AppError("Movement was not persisted", "INTERNAL_ERROR", 500);
    }

    return {
      id: created.id,
      clientProfileId: created.clientProfileId,
      assetId: created.assetId,
      direction: created.direction,
      amountUsd: Number(created.amountUsd),
      effectiveAt: created.effectiveAt.toISOString(),
      ...(created.notes ? { notes: created.notes } : {}),
    };
  } catch (error) {
    logger.error({ error, recordedByUserId }, "Persisting movement in database failed");
    throw new AppError("Unable to persist movement", "INTERNAL_ERROR", 500);
  }
}
