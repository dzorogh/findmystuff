"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Search, Box, MapPin, Container, Building2, LogOut, User as UserIcon, Menu } from "lucide-react";
import GoogleSignIn from "@/components/google-signin";
import Logo from "@/components/logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Navbar = () => {
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

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
          <Link href="/" className="flex items-center">
            <Logo size="md" showText={true} />
          </Link>
          {user && (
            <>
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        size="sm"
                        className="gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </div>
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Открыть меню</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle>Меню</SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-2 mt-6">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Button
                            variant={isActive ? "secondary" : "ghost"}
                            className="w-full justify-start gap-3 h-auto py-3"
                          >
                            <Icon className="h-5 w-5" />
                            <span className="text-base">{item.label}</span>
                          </Button>
                        </Link>
                      );
                    })}
                    <div className="border-t pt-4 mt-4">
                      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                        <UserIcon className="h-4 w-4" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-auto py-3 mt-2"
                        onClick={handleSignOut}
                      >
                        <LogOut className="h-5 w-5" />
                        <span className="text-base">Выйти</span>
                      </Button>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <UserIcon className="h-4 w-4" />
                <span className="max-w-[150px] truncate">{user.email}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Выйти</span>
              </Button>
            </>
          ) : (
            <GoogleSignIn />
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
