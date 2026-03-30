import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { HomeQuickActions } from "@/components/home/home-quick-actions";

export const metadata: Metadata = {
  title: "Главная",
};

export default function Home() {
  return (
    <div className="flex flex-col gap-8 pb-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-6 py-12 sm:px-12 sm:py-16 border bg-card shadow-sm">
        {/* Decorative background blobs */}
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-start gap-4 sm:items-center sm:text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70">
            FindMyStuff
          </h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            Организуйте свои вещи легко и удобно. Всё на своих местах и всегда под рукой.
          </p>
          
          <div className="mt-4 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center">
            <Link href="/search" className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground h-12 px-8 text-base font-medium shadow-lg shadow-primary/25 transition-transform hover:scale-105 hover:bg-primary/90 duration-300">
              <Search className="mr-2 h-5 w-5" />
              Найти вещь
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Быстрый доступ</h2>
        </div>
        <HomeQuickActions />
      </div>
    </div>
  );
}
