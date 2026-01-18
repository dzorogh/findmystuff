import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { getDatabaseUrl } from "./supabase/database-url";

// Получаем DATABASE_URL (автоматически из Supabase переменных или из DATABASE_URL)
const databaseUrl = getDatabaseUrl();

export const auth = betterAuth({
  database: new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("supabase.co") || databaseUrl.includes("pooler.supabase.com") 
      ? { rejectUnauthorized: false } 
      : undefined,
  }),
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }
  },
});
