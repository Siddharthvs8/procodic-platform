const { spawnSync } = require("node:child_process");

// Migrations need a direct connection: transaction poolers cannot hold the
// session advisory lock used by Prisma Migrate. Keep runtime pooling unchanged.
const directUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_POSTGRES_URL_NON_POOLING;
const prisma = require.resolve("prisma/build/index.js", { paths: [process.cwd()] });
const options = {
  stdio: "inherit",
  env: { ...process.env, ...(directUrl ? { DATABASE_URL: directUrl } : {}) },
};
// Avoid acquiring a migration lock for application-only releases. Status exits
// successfully only when all checked-in migrations are already applied.
const status = spawnSync(process.execPath, [prisma, "migrate", "status"], options);
if (status.status === 0) process.exit(0);
const result = spawnSync(process.execPath, [prisma, "migrate", "deploy"], options);
if (result.error) { console.error("Could not start Prisma migration:", result.error.message); }
process.exit(result.status ?? 1);
