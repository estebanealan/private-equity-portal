import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).optional(),
    APP_URL: z.string().url().optional(),
    DATABASE_URL: z.string().startsWith("postgresql://").optional(),
    REDIS_URL: z.string().startsWith("redis://").optional(),
    AUTH_SECRET: z.string().min(32).optional(),
    AUTH_TRUST_HOST: z.enum(["true", "false"]).optional(),
    MFA_ENCRYPTION_KEY: z.string().min(44).optional(),
    MFA_ISSUER: z.string().min(3).max(64).optional(),
    R2_ACCOUNT_ID: z.string().min(1).optional(),
    R2_ACCESS_KEY_ID: z.string().min(1).optional(),
    R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    R2_BUCKET: z.string().min(1).optional(),
    R2_PUBLIC_BASE_URL: z.string().url().optional(),
    SENTRY_DSN: z.string().url().optional(),
  })
  .strict();

export const env = envSchema.parse({
  NODE_ENV: process.env["NODE_ENV"],
  APP_URL: process.env["APP_URL"],
  DATABASE_URL: process.env["DATABASE_URL"],
  REDIS_URL: process.env["REDIS_URL"],
  AUTH_SECRET: process.env["AUTH_SECRET"],
  AUTH_TRUST_HOST: process.env["AUTH_TRUST_HOST"],
  MFA_ENCRYPTION_KEY: process.env["MFA_ENCRYPTION_KEY"],
  MFA_ISSUER: process.env["MFA_ISSUER"],
  R2_ACCOUNT_ID: process.env["R2_ACCOUNT_ID"],
  R2_ACCESS_KEY_ID: process.env["R2_ACCESS_KEY_ID"],
  R2_SECRET_ACCESS_KEY: process.env["R2_SECRET_ACCESS_KEY"],
  R2_BUCKET: process.env["R2_BUCKET"],
  R2_PUBLIC_BASE_URL: process.env["R2_PUBLIC_BASE_URL"],
  SENTRY_DSN: process.env["SENTRY_DSN"],
});

export type Env = z.infer<typeof envSchema>;

export function hasEnv(key: keyof Env) {
  return Boolean(env[key]);
}

export function requireEnv<K extends keyof Env>(key: K): NonNullable<Env[K]> {
  const value = env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value as NonNullable<Env[K]>;
}
