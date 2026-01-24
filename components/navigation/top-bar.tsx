"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, Settings, LogOut, Moon, Sun, User as UserIcon, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Button, buttonVariants } from "@/components/ui/button";
import Logo from "@/components/common/logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const sectionTitleConfig = [
  { prefix: "/containers/", title: "Контейнер" },
  { prefix: "/items/", title: "Вещь" },
  { prefix: "/places/", title: "Место" },
  { prefix: "/rooms/", title: "Помещение" },
  { prefix: "/users", title: "Пользователи" },
  { prefix: "/settings", title: "Настройки" },
  { prefix: "/containers", title: "Контейнеры" },
  { prefix: "/items", title: "Вещи" },
  { prefix: "/places", title: "Места" },
  { prefix: "/rooms", title: "Помещения" },
];

const getSectionTitle = (pathname: string) => {
  const match = sectionTitleConfig.find((item) => pathname.startsWith(item.prefix));

  if (match) {
    return match.title;
  }

  return "Раздел";
};

const TopBar = () => {
  const { user } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const sectionTitle = useMemo(() => getSectionTitle(pathname), [pathname]);
  const canCreate = ["/items", "/places", "/containers", "/rooms", "/users"].includes(pathname);
  const createLabelMap: Record<string, string> = {
    "/items": "Добавить вещь",
    "/places": "Добавить место",
    "/containers": "Добавить контейнер",
    "/rooms": "Добавить помещение",
    "/users": "Добавить пользователя",
  };

  if (!user) {
    return null;
  }

  const handleMenuOpenChange = (open: boolean) => {
    setIsMenuOpen(open);
  };

  const handleThemeToggle = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
  };

  const handleSettingsClick = () => {
    setIsMenuOpen(false);
  };

  const handleCreateClick = () => {
    if (!canCreate) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("create", "1");
    const nextUrl = `${pathname}?${params.toString()}`;
    router.replace(nextUrl, { scroll: false });
  };

  return (
    <header className="md:hidden fixed inset-x-0 top-0 z-40 border-b bg-background">
      <div className="pt-[var(--app-safe-top)]">
        <div className="flex h-[var(--app-header-height)] items-center justify-between px-4">
          <div className="flex items-center gap-2 min-w-0">
            {pathname === "/" ? (
              <>
                <Logo size="md" showText={false} />
                <span className="text-base font-semibold truncate">FindMyStuff</span>
              </>
            ) : (
              <span className="text-base font-semibold truncate">{sectionTitle}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {canCreate && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCreateClick}
                aria-label={createLabelMap[pathname] || "Добавить"}
              >
                <Plus className="h-5 w-5" />
              </Button>
            )}
            <Sheet open={isMenuOpen} onOpenChange={handleMenuOpenChange}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Открыть меню аккаунта"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            <SheetContent side="top" className="px-6">
              <SheetHeader>
                <SheetTitle>Аккаунт</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground">
                  <UserIcon className="h-4 w-4" />
                  <span className="truncate">{user.email}</span>
                </div>
                <Link
                  href="/settings"
                  onClick={handleSettingsClick}
                  aria-label="Перейти в настройки"
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "w-full justify-start gap-2"
                  )}
                >
                  <Settings className="h-4 w-4" />
                  <span>Настройки</span>
                </Link>
                <Button
                  variant="ghost"
                  onClick={handleThemeToggle}
                  className="w-full justify-start gap-2"
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                  <span>Сменить тему</span>
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
            </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
