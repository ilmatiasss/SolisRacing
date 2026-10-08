import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";
import { databaseUrl } from "./src/lib/db/url";

loadEnvConfig(process.cwd());

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  casing: "snake_case",
  dbCredentials: {
    url: databaseUrl() ?? "",
  },
});
