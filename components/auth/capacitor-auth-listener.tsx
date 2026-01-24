"use client";

import { useEffect } from "react";
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

    const handleAuthUrl = async (url: string) => {
      if (!url) {
        return;
      }

      let parsedUrl: URL;

      try {
        parsedUrl = new URL(url);
      } catch {
        return;
      }

      const code = parsedUrl.searchParams.get("code");

      if (!code) {
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Supabase exchangeCodeForSession error:", error);
        return;
      }

      try {
        await Browser.close();
      } catch {
        // noop
      }

      router.replace("/");
    };

    const handleInitialUrl = async () => {
      const { url } = await App.getLaunchUrl();

      if (!url) {
        return;
      }

      await handleAuthUrl(url);
    };

    void handleInitialUrl();

    const listener = App.addListener("appUrlOpen", ({ url }) => {
      void handleAuthUrl(url);
    });

    return () => {
      listener.remove();
    };
  }, [router]);

  return null;
};

export default CapacitorAuthListener;
