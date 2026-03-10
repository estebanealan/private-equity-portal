import { randomUUID } from "node:crypto";

import type { AuthRole } from "@/lib/auth";

export type DemoUserRecord = {
  id: string;
  email: string;
  fullName: string;
  role: AuthRole;
  plainPassword: string;
  clientProfileId?: string;
};

export type DemoAssetRecord = {
  id: string;
  name: string;
  sector: string;
  region: string;
};

export type DemoMovementRecord = {
  id: string;
  clientProfileId: string;
  clientCode: string;
  assetId: string;
  assetName: string;
  direction: "inflow" | "outflow" | "transfer";
  amountUsd: number;
  effectiveAt: string;
  notes?: string;
  recordedByUserId: string;
  recordedByName: string;
};

export type DemoSnapshotRecord = {
  clientProfileId: string;
  navUsd: number;
  committedUsd: number;
  distributedUsd: number;
  irrNet: number;
  multipleNet: number;
  snapshotDate: string;
};

export const demoUsers: DemoUserRecord[] = [
  {
    id: "usr_admin_001",
    email: "admin@aurelia.test",
    fullName: "Elena Vargas",
    role: "admin",
    plainPassword: "Admin123!",
  },
  {
    id: "usr_client_001",
    email: "client@aurelia.test",
    fullName: "Martin Keller",
    role: "client",
    plainPassword: "Client123!",
    clientProfileId: "cli_001",
  },
];

export const demoAssets: DemoAssetRecord[] = [
  { id: "ast_energy_001", name: "Northwind Energy I", sector: "Energy", region: "Europe" },
  {
    id: "ast_infra_001",
    name: "Pacific Infrastructure II",
    sector: "Infrastructure",
    region: "LatAm",
  },
  {
    id: "ast_log_001",
    name: "Atlas Logistics Growth",
    sector: "Logistics",
    region: "North America",
  },
];

const seedMovements: DemoMovementRecord[] = [
  {
    id: "mov_001",
    clientProfileId: "cli_001",
    clientCode: "AK-014",
    assetId: "ast_energy_001",
    assetName: "Northwind Energy I",
    direction: "inflow",
    amountUsd: 3500000,
    effectiveAt: "2026-02-12T15:00:00.000Z",
    notes: "Capital call settled",
    recordedByUserId: "usr_admin_001",
    recordedByName: "Elena Vargas",
  },
  {
    id: "mov_002",
    clientProfileId: "cli_001",
    clientCode: "AK-014",
    assetId: "ast_infra_001",
    assetName: "Pacific Infrastructure II",
    direction: "inflow",
    amountUsd: 2500000,
    effectiveAt: "2026-01-08T15:00:00.000Z",
    notes: "Commitment deployment",
    recordedByUserId: "usr_admin_001",
    recordedByName: "Elena Vargas",
  },
  {
    id: "mov_003",
    clientProfileId: "cli_001",
    clientCode: "AK-014",
    assetId: "ast_log_001",
    assetName: "Atlas Logistics Growth",
    direction: "outflow",
    amountUsd: 900000,
    effectiveAt: "2026-03-03T15:00:00.000Z",
    notes: "Distribution",
    recordedByUserId: "usr_admin_001",
    recordedByName: "Elena Vargas",
  },
];

export const demoSnapshots: DemoSnapshotRecord[] = [
  {
    clientProfileId: "cli_001",
    navUsd: 18400000,
    committedUsd: 22000000,
    distributedUsd: 3100000,
    irrNet: 14.8,
    multipleNet: 1.42,
    snapshotDate: "2026-03-01T00:00:00.000Z",
  },
];

let demoMovements = [...seedMovements];

export function listDemoMovements(clientProfileId?: string) {
  const collection = clientProfileId
    ? demoMovements.filter((item) => item.clientProfileId === clientProfileId)
    : demoMovements;

  return collection.toSorted((left, right) => right.effectiveAt.localeCompare(left.effectiveAt));
}

export function appendDemoMovement(
  input: Omit<DemoMovementRecord, "id" | "assetName" | "clientCode" | "recordedByName">,
) {
  const asset = demoAssets.find((item) => item.id === input.assetId);
  const user = demoUsers.find((item) => item.id === input.recordedByUserId);

  const created: DemoMovementRecord = {
    id: randomUUID(),
    clientProfileId: input.clientProfileId,
    clientCode: "AK-014",
    assetId: input.assetId,
    assetName: asset?.name ?? "Unknown asset",
    direction: input.direction,
    amountUsd: input.amountUsd,
    effectiveAt: input.effectiveAt,
    ...(input.notes ? { notes: input.notes } : {}),
    recordedByUserId: input.recordedByUserId,
    recordedByName: user?.fullName ?? "Unknown user",
  };

  demoMovements = [created, ...demoMovements];

  return created;
}

export function getDemoSnapshot(clientProfileId: string) {
  return demoSnapshots.find((item) => item.clientProfileId === clientProfileId) ?? null;
}

export function getDemoAssetAllocations(clientProfileId: string) {
  const movements = listDemoMovements(clientProfileId);
  const allocationMap = new Map<string, number>();

  for (const movement of movements) {
    const current = allocationMap.get(movement.assetName) ?? 0;
    const delta = movement.direction === "outflow" ? -movement.amountUsd : movement.amountUsd;
    allocationMap.set(movement.assetName, Math.max(0, current + delta));
  }

  const total = [...allocationMap.values()].reduce((sum, value) => sum + value, 0);

  return [...allocationMap.entries()].map(([name, value]) => ({
    name,
    share: total > 0 ? `${Math.round((value / total) * 100)}%` : "0%",
    value,
  }));
}
