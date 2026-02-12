import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import NativeAppMarker from "@/components/common/native-app-marker";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { UserProvider } from "@/lib/users/context";
import { SettingsProvider } from "@/lib/settings/context";
import type { Metadata } from "next";

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
  title: {
    template: "%s - FindMyStuff",
    default: "FindMyStuff",
  },
  description: "Приложение для учета домашнего склада и быстрого поиска вещей",
};

export default function AuthRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${geistSans.className} ${geistMono.variable} overscroll-y-none h-[100svh] h-[100dvh] bg-background`}
    >
      <body
        data-native="false"
        className="antialiased overscroll-y-none h-[100svh] h-[100dvh] bg-background [--app-safe-top:env(safe-area-inset-top)] [--app-safe-bottom:env(safe-area-inset-bottom)]"
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
              <div className="h-[100svh] h-[100dvh] overflow-hidden bg-background">
                <main className="h-full overflow-y-auto pt-[var(--app-safe-top)] pb-[var(--app-safe-bottom)]">
                  {children}
                </main>
              </div>
            </SettingsProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
