"use client";

import { memo } from "react";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { UserProvider } from "@/contexts/user-context";
import { SettingsProvider } from "@/contexts/settings-context";
import { Toaster } from "sonner";
import { AuthLayout } from "@/components/layouts/auth-layout";
import CapacitorAuthListener from "@/components/auth/capacitor-auth-listener";

interface ProvidersProps {
  children: React.ReactNode;
}

const ProvidersComponent = ({ children }: ProvidersProps) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      storageKey="theme"
      enableColorScheme={false}
      forcedTheme={undefined}
    >
      <UserProvider>
        <SettingsProvider>
          <CapacitorAuthListener />
          <AuthLayout>{children}</AuthLayout>
          <Toaster />
        </SettingsProvider>
      </UserProvider>
    </ThemeProvider>
  );
};

export const Providers = memo(ProvidersComponent);
Providers.displayName = "Providers";
