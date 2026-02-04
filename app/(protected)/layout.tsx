import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "@/app/globals.css";
import NativeAppMarker from "@/components/common/native-app-marker";
import CapacitorAuthListener from "@/components/auth/capacitor-auth-listener";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { UserProvider } from "@/lib/users/context";
import { SettingsProvider } from "@/lib/settings/context";
import { CurrentPageProvider } from "@/lib/app/contexts/current-page-context";
import Sidebar from "@/components/navigation/sidebar";
import TopBar from "@/components/navigation/top-bar";
import { QuickMoveProvider } from "@/lib/app/contexts/quick-move-context";
import { PageContainer } from "@/components/layouts/page-container";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/users/server";

const geistSans = Geist({
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getServerUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${geistSans.className} overscroll-y-none h-[100svh] h-[100dvh] bg-background`}
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
                <QuickMoveProvider>
                  <div className="h-[100svh] h-[100dvh] overflow-hidden bg-background grid md:grid-cols-[256px_1fr] grid-rows-[1fr_auto] md:grid-rows-1">
                    <div className="hidden md:block row-start-1 row-end-2 col-start-1 col-end-2 overflow-y-auto">
                      <Sidebar />
                    </div>

                    <main className="row-start-1 row-end-2 md:row-start-1 md:row-end-2 col-start-1 col-end-2 md:col-start-2 md:col-end-3 flex flex-col overflow-hidden bg-background">
                      <div className="shrink-0 relative z-40">
                        <TopBar />
                      </div>
                      <div className="flex-1 overflow-y-auto md:pb-0 overscroll-y-auto">
                        <PageContainer>{children}</PageContainer>
                      </div>
                    </main>

                    <div className="md:hidden row-start-2 row-end-3 col-start-1 col-end-2 shrink-0 border-t bg-background">
                      <Sidebar />
                    </div>
                  </div>
                </QuickMoveProvider>
                <Toaster />
              </CurrentPageProvider>
            </SettingsProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
