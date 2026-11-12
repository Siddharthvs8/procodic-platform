const { cpSync, mkdirSync } = require("node:fs");
const { resolve } = require("node:path");
const root = resolve(__dirname, "..");
const target = resolve(root, "apps/api/src/generated/client");
mkdirSync(target, { recursive: true });
cpSync(resolve(root, "packages/db/generated/client"), target, { recursive: true });
