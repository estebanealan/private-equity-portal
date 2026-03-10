import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/lib/env";

const globalForDb = globalThis as typeof globalThis & {
  dbClient?: ReturnType<typeof postgres>;
};

const databaseUrl = env.DATABASE_URL;
const client = databaseUrl
  ? (globalForDb.dbClient ??
    postgres(databaseUrl, {
      max: 1,
      prepare: false,
    }))
  : null;

if (client && env.NODE_ENV !== "production") {
  globalForDb.dbClient = client;
}

export const db = client ? drizzle(client) : null;
