"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { useQuickMove } from "@/contexts/quick-move-context";
import { Button } from "@/components/ui/button";
import { Search, Box, MapPin, Container, Building2, LogOut, User as UserIcon, Settings, Users, Moon, Sun, ArrowRightLeft } from "lucide-react";
import Logo from "@/components/common/logo";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

interface NavItemConfig {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SidebarNavContent = ({
  pathname,
  onQuickMoveOpen,
}: {
  pathname: string;
  onQuickMoveOpen: () => void;
}) => {
  const searchItem: NavItemConfig = { href: "/", label: "Поиск", icon: Search };
  const storageItems: NavItemConfig[] = [
    { href: "/rooms", label: "Помещения", icon: Building2 },
    { href: "/places", label: "Места", icon: MapPin },
    { href: "/containers", label: "Контейнеры", icon: Container },
    { href: "/items", label: "Вещи", icon: Box },
  ];
  const managementItems: NavItemConfig[] = [
    { href: "/users", label: "Пользователи", icon: Users },
    { href: "/settings", label: "Настройки", icon: Settings },
  ];

  const renderNavItem = (item: NavItemConfig) => {
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
      <Button
        variant="default"
        className="w-full justify-start gap-3 h-10 px-3"
        onClick={onQuickMoveOpen}
        aria-label="Быстрое перемещение"
      >
        <ArrowRightLeft className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">Быстрое перемещение</span>
      </Button>
      {renderNavItem(searchItem)}
      <div className="h-[1px] bg-border my-1" />
      {storageItems.map(renderNavItem)}
      <div className="h-[1px] bg-border my-1" />
      {managementItems.map(renderNavItem)}
    </nav>
  );
};

const Sidebar = () => {
  const { user, isLoading } = useUser();
  const { setOpen: setQuickMoveOpen } = useQuickMove();
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
  const pathname = usePathname();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
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
          <SidebarNavContent pathname={pathname} onQuickMoveOpen={() => setQuickMoveOpen(true)} />
        </div>
        <div className="border-t p-4 space-y-2">
          <div className="px-4 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <UserIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground truncate">Аккаунт</span>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-1 ml-6">{user.email}</p>
          </div>
          <Button
            variant="ghost"
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
            onClick={handleSignOut}
            className="w-full justify-start gap-2"
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </Button>
        </div>
      </aside>

      {/* Mobile Bottom Nav: 2 links | center Quick Move | 2 links */}
      <nav className="md:hidden bg-background">
        <div className="flex h-[calc(var(--app-bottom-nav-height)+var(--app-safe-bottom))] items-center justify-between gap-1 px-1 pb-[var(--app-safe-bottom)]">
          <Link
            href="/rooms"
            aria-current={pathname.startsWith("/rooms") ? "page" : undefined}
            aria-label="Помещения"
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 rounded-md py-2 text-[11px] font-medium transition-colors",
              pathname.startsWith("/rooms") ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Building2 className="h-5 w-5" />
            <span className="sr-only">Помещения</span>
          </Link>
          <Link
            href="/places"
            aria-current={pathname.startsWith("/places") ? "page" : undefined}
            aria-label="Места"
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 rounded-md py-2 text-[11px] font-medium transition-colors",
              pathname.startsWith("/places") ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MapPin className="h-5 w-5" />
            <span className="sr-only">Места</span>
          </Link>
          <Button
            type="button"
            size="icon"
            className="h-12 w-12 shrink-0 rounded-full mx-4"
            onClick={() => setQuickMoveOpen(true)}
            aria-label="Быстрое перемещение"
          >
            <ArrowRightLeft className="h-6 w-6" />
          </Button>
          <Link
            href="/containers"
            aria-current={pathname.startsWith("/containers") ? "page" : undefined}
            aria-label="Контейнеры"
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 rounded-md py-2 text-[11px] font-medium transition-colors",
              pathname.startsWith("/containers") ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Container className="h-5 w-5" />
            <span className="sr-only">Контейнеры</span>
          </Link>
          <Link
            href="/items"
            aria-current={pathname.startsWith("/items") ? "page" : undefined}
            aria-label="Вещи"
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 rounded-md py-2 text-[11px] font-medium transition-colors",
              pathname.startsWith("/items") ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Box className="h-5 w-5" />
            <span className="sr-only">Вещи</span>
          </Link>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
