import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "@/app/globals.css";
import NativeAppMarker from "@/components/common/native-app-marker";
import CapacitorAuthListener from "@/components/auth/capacitor-auth-listener";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { UserProvider } from "@/lib/users/context";
import { SettingsProvider } from "@/lib/settings/context";
import { CurrentPageProvider } from "@/lib/app/contexts/current-page-context";
import AppSidebar from "@/components/navigation/app-sidebar";
import { QuickMoveProvider } from "@/lib/app/contexts/quick-move-context";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getServerUser } from "@/lib/users/server";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

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

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

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
            <SettingsProvider>
              <CurrentPageProvider>
                <SidebarProvider defaultOpen={defaultOpen}>
                  <CapacitorAuthListener />
                  <QuickMoveProvider>
                    <TooltipProvider>
                      <AppSidebar />

                      <SidebarInset>
                        <main className="flex flex-col flex-1 overflow-hidden h-full">
                          <div className="flex-1 overflow-y-auto">
                            <div className="mx-auto md:p-6 p-4">
                              {children}
                            </div>
                          </div>
                        </main>
                      </SidebarInset>
                    </TooltipProvider>
                  </QuickMoveProvider>
                  <Toaster />
                </SidebarProvider>
              </CurrentPageProvider>
            </SettingsProvider>
          </UserProvider>
        </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
