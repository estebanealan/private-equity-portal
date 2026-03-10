const required = ["APP_URL", "DATABASE_URL", "AUTH_SECRET", "MFA_ENCRYPTION_KEY"];

const recommended = ["REDIS_URL", "MFA_ISSUER", "SENTRY_DSN", "R2_PUBLIC_BASE_URL"];

const missingRequired = required.filter((key) => !process.env[key]);
const missingRecommended = recommended.filter((key) => !process.env[key]);

if (missingRequired.length > 0) {
  process.stderr.write("Missing required staging env vars:\n");
  for (const key of missingRequired) {
    process.stderr.write(`- ${key}\n`);
  }
  process.exit(1);
}

process.stdout.write("Required staging env vars are present.\n");

if (missingRecommended.length > 0) {
  process.stdout.write("Missing recommended env vars:\n");
  for (const key of missingRecommended) {
    process.stdout.write(`- ${key}\n`);
  }
}
