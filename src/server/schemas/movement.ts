import { z } from "zod";

export const createMovementSchema = z.object({
  clientProfileId: z.string().min(1),
  assetId: z.string().min(1),
  direction: z.enum(["inflow", "outflow", "transfer"]),
  amountUsd: z.number().positive(),
  effectiveAt: z.iso.datetime(),
  notes: z.string().max(500).optional(),
});

export const listMovementQuerySchema = z.object({
  clientProfileId: z.string().min(1).optional(),
});

export type CreateMovementInput = z.infer<typeof createMovementSchema>;
