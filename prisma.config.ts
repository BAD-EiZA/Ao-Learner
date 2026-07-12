import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prefer direct URL for migrations (Supabase: port 5432 / session mode)
const migrateUrl =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL_POOLED ||
  process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: migrateUrl,
  },
});
