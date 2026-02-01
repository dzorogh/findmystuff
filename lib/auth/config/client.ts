"use client";

import { createAuthClient } from "better-auth/react";

const resolveBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
};

export const authClient = createAuthClient({
  baseURL: resolveBaseUrl(),
});
