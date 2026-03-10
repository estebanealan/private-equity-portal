import { desc, eq } from "drizzle-orm";
import { assets, movements, portfolioSnapshots } from "@/db/schema";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getDemoAssetAllocations, getDemoSnapshot, listDemoMovements } from "@/server/demo-data";

export async function getPortfolioSnapshot(clientProfileId: string) {
  if (db) {
    try {
      const rows = await db
        .select({
          navUsd: portfolioSnapshots.navUsd,
          committedUsd: portfolioSnapshots.committedUsd,
          distributedUsd: portfolioSnapshots.distributedUsd,
          irrNet: portfolioSnapshots.irrNet,
          multipleNet: portfolioSnapshots.multipleNet,
          snapshotDate: portfolioSnapshots.snapshotDate,
        })
        .from(portfolioSnapshots)
        .where(eq(portfolioSnapshots.clientProfileId, clientProfileId))
        .orderBy(desc(portfolioSnapshots.snapshotDate))
        .limit(1);

      const record = rows[0];
      if (record) {
        return {
          ...record,
          navUsd: Number(record.navUsd),
          committedUsd: Number(record.committedUsd),
          distributedUsd: Number(record.distributedUsd),
          irrNet: record.irrNet ? Number(record.irrNet) : null,
          multipleNet: record.multipleNet ? Number(record.multipleNet) : null,
          snapshotDate: record.snapshotDate.toISOString(),
        };
      }
    } catch (error) {
      logger.warn({ error }, "Falling back to demo snapshot repository");
    }
  }

  return getDemoSnapshot(clientProfileId);
}

export async function getPortfolioAllocations(clientProfileId: string) {
  if (db) {
    try {
      const rows = await db
        .select({
          assetName: assets.name,
          amountUsd: movements.amountUsd,
          direction: movements.direction,
        })
        .from(movements)
        .innerJoin(assets, eq(assets.id, movements.assetId))
        .where(eq(movements.clientProfileId, clientProfileId));

      const totals = new Map<string, number>();
      for (const row of rows) {
        const current = totals.get(row.assetName) ?? 0;
        const delta = row.direction === "outflow" ? -Number(row.amountUsd) : Number(row.amountUsd);
        totals.set(row.assetName, Math.max(0, current + delta));
      }

      const total = [...totals.values()].reduce((sum, value) => sum + value, 0);
      return [...totals.entries()].map(([name, value]) => ({
        name,
        share: total > 0 ? `${Math.round((value / total) * 100)}%` : "0%",
        value,
      }));
    } catch (error) {
      logger.warn({ error }, "Falling back to demo allocation repository");
    }
  }

  return getDemoAssetAllocations(clientProfileId);
}

export async function getRecentPortfolioActivity(clientProfileId: string) {
  return listDemoMovements(clientProfileId).slice(0, 5);
}
