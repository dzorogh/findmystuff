import { betterAuth, type BetterAuthOptions } from "better-auth";
import { Pool } from "pg";
import { getDatabaseUrl } from "@/lib/shared/supabase/database-url";

let authInstance: ReturnType<typeof betterAuth> | null = null;

export const getAuth = (): ReturnType<typeof betterAuth> => {
  if (authInstance) return authInstance;
  const databaseUrl = getDatabaseUrl();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set");
  }
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  authInstance = betterAuth({
    database: new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("supabase.co") || databaseUrl.includes("pooler.supabase.com")
        ? { rejectUnauthorized: true }
        : undefined,
    }),
    baseURL: appUrl,
    emailAndPassword: {
      enabled: true,
    },
    socialProviders:
      clientId && clientSecret
        ? {
            google: {
              clientId,
              clientSecret,
            },
          }
        : undefined,
  } as BetterAuthOptions);
  return authInstance;
};
