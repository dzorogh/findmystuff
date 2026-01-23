import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { getDatabaseUrl } from "./supabase/database-url";

// Получаем DATABASE_URL (автоматически из Supabase переменных или из DATABASE_URL)
const databaseUrl = getDatabaseUrl();

const appUrl = process.env.NEXT_PUBLIC_APP_URL;
if (!appUrl) {
  throw new Error("NEXT_PUBLIC_APP_URL is not set");
}

export const auth = betterAuth({
  database: new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("supabase.co") || databaseUrl.includes("pooler.supabase.com") 
      ? { rejectUnauthorized: false } 
      : undefined,
  }),
  baseURL: appUrl,
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
