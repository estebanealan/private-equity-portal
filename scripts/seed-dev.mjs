import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("Missing DATABASE_URL. Load your .env.local before seeding.");
  process.exit(1);
}

const thisDir = fileURLToPath(new URL(".", import.meta.url));
const seedPath = resolve(thisDir, "sql", "seed-dev.sql");
const sqlText = await readFile(seedPath, "utf8");

const sql = postgres(databaseUrl, {
  max: 1,
  prepare: false,
});

try {
  await sql.unsafe(sqlText);
  process.stdout.write("Seed completed successfully.\\n");
} finally {
  await sql.end({ timeout: 5 });
}
