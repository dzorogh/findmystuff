"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Search, Box, MapPin, Container, Building2, LogOut, User as UserIcon } from "lucide-react";
import Logo from "@/components/logo";
import GoogleSignIn from "@/components/google-signin";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const Sidebar = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Ошибка получения пользователя:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { href: "/", label: "Поиск", icon: Search },
    { href: "/rooms", label: "Помещения", icon: Building2 },
    { href: "/places", label: "Места", icon: MapPin },
    { href: "/containers", label: "Контейнеры", icon: Container },
    { href: "/items", label: "Вещи", icon: Box },
  ];

  const NavContent = () => (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className="w-full justify-start gap-3 h-10 px-3"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </Button>
          </Link>
        );
      })}
    </nav>
  );

  if (isLoading) {
    return (
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 border-r bg-background flex-col">
        <div className="h-16 flex items-center px-4 border-b">
          <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex-1 p-4">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />
            ))}
          </div>
        </div>
      </aside>
    );
  }

  if (!user) {
    return (
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 border-r bg-background flex-col">
        <div className="h-16 flex items-center px-4 border-b">
          <Link href="/" className="flex items-center">
            <Logo size="md" showText={true} />
          </Link>
        </div>
        <div className="flex-1 p-4 flex items-center justify-center">
          <GoogleSignIn />
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 border-r bg-background flex-col z-40">
        {/* Header */}
        <div className="h-16 flex items-center px-4 border-b shrink-0">
          <Link href="/" className="flex items-center">
            <Logo size="md" showText={true} />
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <NavContent />
        </div>

        {/* User Section */}
        <div className="border-t p-4 shrink-0 space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground rounded-md bg-muted/50">
            <UserIcon className="h-4 w-4 shrink-0" />
            <span className="truncate text-xs">{user.email}</span>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-10 px-3"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">Выйти</span>
          </Button>
        </div>
      </aside>

      {/* Mobile Menu */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center">
            <Logo size="sm" showText={true} />
          </Link>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Открыть меню</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <div className="flex flex-col h-full">
                <div className="px-4 h-14 flex items-center border-b">
                  <Logo size="sm" showText={true} />
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <NavContent />
                </div>
                <div className="border-t p-4 space-y-2">
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground rounded-md bg-muted/50">
                    <UserIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-10 px-3"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium">Выйти</span>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
