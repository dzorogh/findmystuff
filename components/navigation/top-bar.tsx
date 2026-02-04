"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, Settings, LogOut, Moon, Sun, User as UserIcon, Plus, ChevronRight } from "lucide-react";
import { useUser } from "@/lib/users/context";
import { useCurrentPage } from "@/lib/app/contexts/current-page-context";
import { signOut } from "@/lib/auth/sign-out";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Logo from "@/components/common/logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/shared/utils";

const sectionTitleConfig = [
  { prefix: "/containers/", title: "Контейнер", listTitle: "Контейнеры", listPath: "/containers" },
  { prefix: "/items/", title: "Вещь", listTitle: "Вещи", listPath: "/items" },
  { prefix: "/places/", title: "Место", listTitle: "Места", listPath: "/places" },
  { prefix: "/rooms/", title: "Помещение", listTitle: "Помещения", listPath: "/rooms" },
  { prefix: "/users", title: "Пользователи", listTitle: "Пользователи", listPath: "/users" },
  { prefix: "/account", title: "Аккаунт", listTitle: "Аккаунт", listPath: "/account" },
  { prefix: "/settings", title: "Настройки", listTitle: "Настройки", listPath: "/settings" },
  { prefix: "/containers", title: "Контейнеры", listTitle: "Контейнеры", listPath: "/containers" },
  { prefix: "/items", title: "Вещи", listTitle: "Вещи", listPath: "/items" },
  { prefix: "/places", title: "Места", listTitle: "Места", listPath: "/places" },
  { prefix: "/rooms", title: "Помещения", listTitle: "Помещения", listPath: "/rooms" },
];

const getSectionTitle = (pathname: string) => {
  const match = sectionTitleConfig.find((item) => pathname.startsWith(item.prefix));

  if (match) {
    return match.title;
  }

  return "Раздел";
};

const getDetailPageInfo = (pathname: string) => {
  const match = sectionTitleConfig.find((item) => 
    item.prefix.endsWith("/") && pathname.startsWith(item.prefix)
  );

  if (match) {
    const escapedPrefix = match.prefix.replace(/\//g, "\\/");
    const idMatch = pathname.match(new RegExp(`^${escapedPrefix}(\\d+)$`));
    if (idMatch) {
      const typeMap: Record<string, "items" | "places" | "containers" | "rooms"> = {
        "/items/": "items",
        "/places/": "places",
        "/containers/": "containers",
        "/rooms/": "rooms",
      };
      const type = typeMap[match.prefix];
      if (type) {
        return {
          type,
          id: parseInt(idMatch[1]),
          listTitle: match.listTitle,
          listPath: match.listPath,
        };
      }
    }
  }

  return null;
};

const TopBar = () => {
  const { user } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {
    entityName,
    isLoading,
    entityActions,
    setEntityName,
    setEntityActions,
    setIsLoading,
  } = useCurrentPage();

  const sectionTitle = useMemo(() => getSectionTitle(pathname), [pathname]);
  const detailPageInfo = useMemo(() => getDetailPageInfo(pathname), [pathname]);
  const canCreate = ["/items", "/places", "/containers", "/rooms", "/users"].includes(pathname);
  const createLabelMap: Record<string, string> = {
    "/items": "Добавить вещь",
    "/places": "Добавить место",
    "/containers": "Добавить контейнер",
    "/rooms": "Добавить помещение",
    "/users": "Добавить пользователя",
  };

  // Очищаем имя, действия и состояние загрузки при переходе на страницы списков
  useEffect(() => {
    if (!detailPageInfo) {
      setEntityName(null);
      setEntityActions(null);
      setIsLoading(false);
    }
  }, [detailPageInfo, setEntityName, setEntityActions, setIsLoading]);

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
    await signOut();
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
    <header className="sticky top-0 z-40 bg-background shrink-0">
      <div className="md:pt-0">
        <div className="flex h-16 border-b  items-center justify-between px-4 md:px-6 box-border">
          <div className="flex items-center gap-2 min-w-0">
            {pathname === "/" ? (
              <>
                <Logo size="md" showText={false} />
                <span className="text-base font-semibold truncate">FindMyStuff</span>
              </>
            ) : detailPageInfo ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <Link
                  href={detailPageInfo.listPath}
                  className="text-base font-semibold text-muted-foreground hover:text-foreground transition-colors truncate"
                >
                  {detailPageInfo.listTitle}
                </Link>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                {isLoading && !entityName ? (
                  <Skeleton className="h-5 w-32" />
                ) : entityName ? (
                  <span className="text-base font-semibold truncate">{entityName}</span>
                ) : null}
              </div>
            ) : (
              <span className="text-base font-semibold truncate">{sectionTitle}</span>
            )}
          </div>
          <div className="flex items-center gap-2 min-w-0">
            {detailPageInfo && entityActions && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {entityActions}
              </div>
            )}
            {canCreate && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCreateClick}
                  aria-label={createLabelMap[pathname] || "Добавить"}
                  className="md:hidden"
                >
                  <Plus className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCreateClick}
                  className="hidden md:inline-flex gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>{createLabelMap[pathname] || "Добавить"}</span>
                </Button>
              </>
            )}
            <Sheet open={isMenuOpen} onOpenChange={handleMenuOpenChange}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Открыть меню аккаунта"
                  className="md:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            <SheetContent side="top" className="px-6">
              <SheetHeader>
                <SheetTitle>Аккаунт</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3">
                <Link
                  href="/account"
                  onClick={() => handleMenuOpenChange(false)}
                  className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Перейти в аккаунт"
                >
                  <UserIcon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="truncate">{user.email}</span>
                </Link>
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
