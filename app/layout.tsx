import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/sidebar";
import { MainWrapper } from "@/components/main-wrapper";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FindMyStuff - Быстрый поиск вещей",
  description: "Приложение для учета домашнего склада и быстрого поиска вещей",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning className="h-full bg-background">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-background`}
      >
        <Sidebar />
        <MainWrapper>{children}</MainWrapper>
        <Toaster />
      </body>
    </html>
  );
}
