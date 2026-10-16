import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./supabase/generated-migrations",
  schema: "./db/schema.ts",
  dialect: "postgresql",
});
