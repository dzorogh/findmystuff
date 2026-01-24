"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { createClient } from "@/lib/supabase/client";

const CapacitorAuthListener = () => {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const supabase = createClient();
    const lastHandledUrlRef = { current: "" };
    const log = (message: string, details?: unknown) => {
      const suffix = details ? ` ${JSON.stringify(details)}` : "";
      console.log(`[auth][capacitor] ${message}${suffix}`);
    };

    const handleAuthUrl = async (url: string) => {
      if (!url) {
        return;
      }

      if (lastHandledUrlRef.current === url) {
        return;
      }

      lastHandledUrlRef.current = url;
      log("handleAuthUrl", url);
      let parsedUrl: URL;

      try {
        parsedUrl = new URL(url);
      } catch {
        log("invalid url", url);
        return;
      }

      const code = parsedUrl.searchParams.get("code");
      const errorParam = parsedUrl.searchParams.get("error_description");
      const hashParams = new URLSearchParams(parsedUrl.hash.replace("#", ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (errorParam) {
        log("auth error", errorParam);
        return;
      }

      if (code) {
        log("exchangeCodeForSession start");
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error("Supabase exchangeCodeForSession error:", error);
          log("exchangeCodeForSession error", error);
          return;
        }
      } else if (accessToken && refreshToken) {
        log("setSession from hash");
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error("Supabase setSession error:", error);
          log("setSession error", error);
          return;
        }
      } else {
        log("no auth data in url");
        return;
      }

      try {
        await Browser.close();
        log("browser closed");
      } catch {
        // noop
      }

      log("auth success, navigating home");
      router.replace("/");
    };

    const handleInitialUrl = async () => {
      const { url } = await App.getLaunchUrl();

      if (!url) {
        log("no initial url");
        return;
      }

      log("initial url", url);
      await handleAuthUrl(url);
    };

    log("listener init");
    void handleInitialUrl();

    const listener = App.addListener("appUrlOpen", ({ url }) => {
      log("appUrlOpen", url);
      void handleAuthUrl(url);
    });

    const appStateListener = App.addListener("appStateChange", async ({ isActive }) => {
      if (!isActive) {
        return;
      }

      const { url } = await App.getLaunchUrl();
      if (url) {
        log("appStateChange launchUrl", url);
        void handleAuthUrl(url);
      }
    });

    return () => {
      log("listener removed");
      listener.remove();
      appStateListener.remove();
    };
  }, [router]);

  return null;
};

export default CapacitorAuthListener;
