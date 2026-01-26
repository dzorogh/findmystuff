"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Search, Box, MapPin, Container, Building2, LogOut, User as UserIcon, Settings, Users, Moon, Sun } from "lucide-react";
import Logo from "@/components/common/logo";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const { user, isLoading } = useUser();
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

    const renderNavItem = (item: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }) => {
      const Icon = item.icon;
      const isActive = pathname === item.href;
      return (
        <Link key={item.href} href={item.href}>
          <Button
            variant={isActive ? "secondary" : "ghost"}
            className="w-full justify-start gap-3 h-10 px-3"
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

  if (isLoading) {
    return (
      <aside className="hidden md:flex h-full w-64 border-r bg-background flex-col">
        <div className="h-16 flex items-center px-4 border-b">
          <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />
            ))}
          </div>
        </div>
      </aside>
    );
  }

  // Sidebar рендерится только для авторизованных пользователей
  // Для неавторизованных используется отдельный layout в AuthLayout
  if (!user) {
    return null;
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex h-full w-64 border-r bg-background flex-col z-40">
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
            <p className="text-xs text-muted-foreground truncate mt-1 ml-6">{user.email}</p>
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
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </Button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden border-t bg-background">
        <div className="flex h-[calc(var(--app-bottom-nav-height)+var(--app-safe-bottom))] items-center justify-around gap-2 px-2 pb-[var(--app-safe-bottom)]">
          {[
            { href: "/", label: "Поиск", icon: Search },
            { href: "/rooms", label: "Помещения", icon: Building2 },
            { href: "/places", label: "Места", icon: MapPin },
            { href: "/containers", label: "Контейнеры", icon: Container },
            { href: "/items", label: "Вещи", icon: Box },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const linkTextClassName = isActive
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground";

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 rounded-md py-2 text-[11px] font-medium transition-colors",
                  linkTextClassName
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="sr-only">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
