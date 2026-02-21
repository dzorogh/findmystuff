import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "@/app/globals.css";
import NativeAppMarker from "@/components/common/native-app-marker";
import CapacitorAuthListener from "@/components/auth/capacitor-auth-listener";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { UserProvider } from "@/lib/users/context";
import { TenantProvider } from "@/contexts/tenant-context";
import { SettingsProvider } from "@/lib/settings/context";
import { CurrentPageProvider } from "@/lib/app/contexts/current-page-context";
import AppSidebar from "@/components/navigation/app-sidebar";
import { QuickMoveProvider } from "@/lib/app/contexts/quick-move-context";
import { AddItemProvider } from "@/lib/app/contexts/add-item-context";
import { MobileBottomBar } from "@/components/navigation/mobile-bottom-bar";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getServerUser } from "@/lib/users/server";
import { getServerTenantCount } from "@/lib/tenants/server-queries";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PWA_THEME_COLORS } from "@/lib/theme-pwa-colors";

export const metadata: Metadata = {
  title: {
    template: "%s - FindMyStuff",
    default: "Поиск",
  },
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
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: PWA_THEME_COLORS.dark },
    { media: "(prefers-color-scheme: light)", color: PWA_THEME_COLORS.light },
  ],
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

  const tenantCount = await getServerTenantCount(user.id);
  if (tenantCount === 0) {
    redirect("/onboarding");
  }

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className="h-full"
    >
      <body
        className={`${GeistSans.variable} antialiased h-full`}
      >
        <NuqsAdapter>
          <NativeAppMarker />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <UserProvider>
              <TenantProvider>
                <SettingsProvider>
                  <CurrentPageProvider>
                    <SidebarProvider defaultOpen={defaultOpen}>
                      <CapacitorAuthListener />
                      <QuickMoveProvider>
                        <AddItemProvider>
                          <TooltipProvider>
                            <AppSidebar />

                            <SidebarInset>
                              <main className="flex flex-col flex-1 overflow-hidden h-full">
                                <div className="flex-1 overflow-y-auto">
                                  <div className="mx-auto p-4 pb-28 md:pb-4">
                                    {children}
                                  </div>
                                </div>
                              </main>
                              <MobileBottomBar />
                            </SidebarInset>
                          </TooltipProvider>
                        </AddItemProvider>
                      </QuickMoveProvider>
                      <Toaster />
                    </SidebarProvider>
                  </CurrentPageProvider>
                </SettingsProvider>
              </TenantProvider>
            </UserProvider>
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
