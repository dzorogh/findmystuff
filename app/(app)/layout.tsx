import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
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
import { getServerUser } from "@/lib/users/server";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

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
      className="h-full"
    >
      <body
        className={`${GeistSans.variable} antialiased h-full`}
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
                <SidebarProvider>
                  <CapacitorAuthListener />
                  <QuickMoveProvider>
                    <AppSidebar />

                    <SidebarInset>
                      <main className="flex flex-col flex-1 overflow-hidden h-full">
                        <div className="flex-1 overflow-y-auto">
                          <div className="mx-auto p-6">
                            {children}
                          </div>
                        </div>
                      </main>
                    </SidebarInset>
                  </QuickMoveProvider>
                  <Toaster />
                </SidebarProvider>
              </CurrentPageProvider>
            </SettingsProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
