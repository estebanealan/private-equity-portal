import { z } from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const mfaCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Code must be exactly 6 digits"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type MfaCodeInput = z.infer<typeof mfaCodeSchema>;
