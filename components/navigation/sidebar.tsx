"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Box, MapPin, Container, Building2, LogOut, User as UserIcon, Settings, Users, Moon, Sun } from "lucide-react";
import Logo from "@/components/common/logo";
import GoogleSignIn from "@/components/auth/google-signin";
import { useTheme } from "next-themes";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const Sidebar = () => {
  const { user, isLoading } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const NavContent = () => {
    const searchItem = { href: "/", label: "Поиск", icon: Search };
    
    const storageItems = [
      { href: "/rooms", label: "Помещения", icon: Building2 },
      { href: "/places", label: "Места", icon: MapPin },
      { href: "/containers", label: "Контейнеры", icon: Container },
      { href: "/items", label: "Вещи", icon: Box },
    ];

    const managementItems = [
      { href: "/users", label: "Пользователи", icon: Users },
      { href: "/settings", label: "Настройки", icon: Settings },
    ];

    const renderNavItem = (item: { href: string; label: string; icon: any }) => {
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
    };

    return (
      <nav className="flex flex-col gap-1">
        {/* Поиск */}
        {renderNavItem(searchItem)}
        
        {/* Разделитель */}
        <div className="h-[1px] bg-border my-1" />
        
        {/* Помещения, Места, Контейнеры, Вещи */}
        {storageItems.map(renderNavItem)}
        
        {/* Разделитель */}
        <div className="h-[1px] bg-border my-1" />
        
        {/* Управление */}
        {managementItems.map(renderNavItem)}
      </nav>
    );
  };

  // Sidebar рендерится только для авторизованных пользователей
  // Для неавторизованных используется отдельный layout в AuthLayout
  if (!isLoading && !user) {
    return null;
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 border-r bg-background flex-col z-40">
        <div className="h-16 flex items-center px-4 border-b">
          <Link href="/" className="flex items-center">
            <Logo size="md" showText={true} />
          </Link>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          <NavContent />
        </div>
        <div className="border-t p-4 space-y-2">
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <UserIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground truncate">Аккаунт</span>
            </div>
            {user ? (
              <p className="text-xs text-muted-foreground truncate mt-1 ml-6">{user.email}</p>
            ) : (
              <Skeleton className="h-4 w-32 mt-1 ml-6" />
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleThemeToggle}
            className="w-full justify-start gap-2"
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            <span>Смена темы</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start gap-2"
            disabled={!user}
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="default"
            size="icon"
            className="md:hidden fixed bottom-4 left-4 z-50 h-14 w-14 rounded-full shadow-lg"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Открыть меню</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
          <div className="flex-1 mt-6">
            <NavContent />
          </div>
          <div className="border-t pt-4 mt-4 space-y-2">
            <div className="px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <UserIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground truncate">Аккаунт</span>
              </div>
              {user ? (
                <p className="text-xs text-muted-foreground truncate mt-1 ml-6">{user.email}</p>
              ) : (
                <p className="text-xs text-muted-foreground truncate mt-1 ml-6">Загрузка...</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleThemeToggle}
              className="w-full justify-start gap-2"
            >
              {mounted && theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span>Смена темы</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="w-full justify-start gap-2"
              disabled={!user}
            >
              <LogOut className="h-4 w-4" />
              Выйти
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Sidebar;
