import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL 이 설정되지 않았습니다. Supabase Settings → Database → Connection string (Session pooler, 6543 포트)을 .env.local 에 DATABASE_URL 로 넣어 주세요.",
  );
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  schemaFilter: ["public"],
  verbose: true,
  strict: true,
});
