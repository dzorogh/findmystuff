import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthLayout } from "@/components/layouts/auth-layout";
import NativeAppMarker from "@/components/common/native-app-marker";
import CapacitorAuthListener from "@/components/auth/capacitor-auth-listener";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { UserProvider } from "@/lib/users/context";
import { SettingsProvider } from "@/lib/settings/context";
import { CurrentPageProvider } from "@/lib/app/contexts/current-page-context";

const geistSans = Geist({
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
});

export const metadata: Metadata = {
  title: "FindMyStuff - Быстрый поиск вещей",
  description: "Приложение для учета домашнего склада и быстрого поиска вещей",
  icons: {
    icon: [
      { url: "/icon", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/icon", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "FindMyStuff",
    statusBarStyle: "default",
  },
};

export const viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${geistSans.className} ${geistMono.variable} overscroll-y-none h-[100svh] h-[100dvh] bg-background`}
    >
      <body
        data-native="false"
        className="antialiased overscroll-y-none h-[100svh] h-[100dvh] bg-background [--app-safe-top:env(safe-area-inset-top)] [--app-safe-bottom:env(safe-area-inset-bottom)] [--app-bottom-nav-height:56px] [--app-header-height:56px] md:[--app-header-height:64px] data-[native=true]:[--app-safe-top:max(env(safe-area-inset-top),3svh)] data-[native=true]:[--app-safe-bottom:max(env(safe-area-inset-bottom),48px,5svh)]"
      >
        <NativeAppMarker />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <UserProvider>
            <SettingsProvider>
              <CurrentPageProvider>
                <CapacitorAuthListener />
                <AuthLayout>{children}</AuthLayout>
                <Toaster />
              </CurrentPageProvider>
            </SettingsProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
