import {
  createMovement,
  listMovementAssets,
  listMovementClients,
  listMovements,
} from "@/server/repositories/movement.repository";
import { createMovementSchema } from "@/server/schemas/movement";

export async function listAdminMovements(clientProfileId?: string) {
  return listMovements(clientProfileId);
}

export async function listAdminMovementClients() {
  return listMovementClients();
}

export async function listAdminMovementAssets() {
  return listMovementAssets();
}

export async function registerMovement(input: unknown, recordedByUserId: string) {
  const payload = createMovementSchema.parse(input);
  return createMovement(payload, recordedByUserId);
}
