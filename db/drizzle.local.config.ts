import { defineConfig } from "drizzle-kit";
import fs from "fs";
import path from "path";

function getLocalD1Path(): string {
  const dir = path.resolve(process.cwd(), ".wrangler/state/v3/d1/miniflare-D1DatabaseObject");
  if (!fs.existsSync(dir)) {
    throw new Error(`Local D1 directory not found at ${dir}. Run your app once first.`);
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sqlite") && f !== "metadata.sqlite");
  if (files.length === 0) {
    throw new Error(`No local D1 sqlite database found in ${dir}.`);
  }
  const resolved = path.join(dir, files[0]).replace(/\\/g, "/");
  return `file:${resolved}`;
}

export default defineConfig({
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: getLocalD1Path(),
  },
});
