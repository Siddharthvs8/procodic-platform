const { spawnSync } = require("node:child_process");

// Migrations need a direct connection: transaction poolers cannot hold the
// session advisory lock used by Prisma Migrate. Keep runtime pooling unchanged.
const directUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_POSTGRES_URL_NON_POOLING;
const result = spawnSync(process.execPath, [require.resolve("prisma/build/index.js", { paths: [process.cwd()] }), "migrate", "deploy"], {
  stdio: "inherit",
  env: { ...process.env, ...(directUrl ? { DATABASE_URL: directUrl } : {}) },
});
if (result.error) { console.error("Could not start Prisma migration:", result.error.message); }
process.exit(result.status ?? 1);
