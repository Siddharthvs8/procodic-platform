import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: process.env.ENV_FILE ?? "../../.env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
});
