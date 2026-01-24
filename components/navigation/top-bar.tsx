"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, Settings, LogOut, Moon, Sun, User as UserIcon, Plus, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
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
import { cn } from "@/lib/utils";

const sectionTitleConfig = [
  { prefix: "/containers/", title: "Контейнер", listTitle: "Контейнеры", listPath: "/containers" },
  { prefix: "/items/", title: "Вещь", listTitle: "Вещи", listPath: "/items" },
  { prefix: "/places/", title: "Место", listTitle: "Места", listPath: "/places" },
  { prefix: "/rooms/", title: "Помещение", listTitle: "Помещения", listPath: "/rooms" },
  { prefix: "/users", title: "Пользователи", listTitle: "Пользователи", listPath: "/users" },
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
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [entityName, setEntityName] = useState<string | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const prevPageKeyRef = useRef<string | null>(null);
  const dataLoadedRef = useRef(false);

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

  useEffect(() => {
    if (!user || !detailPageInfo) {
      setEntityName(null);
      setShowSkeleton(false);
      prevPageKeyRef.current = null;
      return;
    }

    const currentPageKey = `${detailPageInfo.type}-${detailPageInfo.id}`;
    const isNewPage = prevPageKeyRef.current !== currentPageKey;
    const shouldShowSkeleton = isNewPage || !entityName;

    // Сбрасываем entityName только при переходе на новую страницу
    if (isNewPage) {
      setEntityName(null);
      prevPageKeyRef.current = currentPageKey;
    }

    let skeletonTimer: NodeJS.Timeout | null = null;
    let isCancelled = false;

    const loadEntityName = async () => {
      // Показываем скелетон для новой страницы или если данных еще нет, с небольшой задержкой для плавности
      if (shouldShowSkeleton) {
        dataLoadedRef.current = false;
        skeletonTimer = setTimeout(() => {
          if (!isCancelled && !dataLoadedRef.current) {
            setShowSkeleton(true);
          }
        }, 50);
      }

      try {
        const tableName = detailPageInfo.type;
        const { data, error } = await supabase
          .from(tableName)
          .select("name")
          .eq("id", detailPageInfo.id)
          .is("deleted_at", null)
          .single();

        if (isCancelled) return;

        dataLoadedRef.current = true;
        
        if (skeletonTimer) {
          clearTimeout(skeletonTimer);
          skeletonTimer = null;
        }
        
        if (!error && data) {
          setEntityName(data.name);
          setShowSkeleton(false);
        } else {
          setEntityName(null);
          setShowSkeleton(false);
        }
      } catch (error) {
        if (isCancelled) return;
        
        dataLoadedRef.current = true;
        
        if (skeletonTimer) {
          clearTimeout(skeletonTimer);
          skeletonTimer = null;
        }
        console.error("Ошибка загрузки названия сущности:", error);
        setEntityName(null);
        setShowSkeleton(false);
      }
    };

    loadEntityName();

    return () => {
      isCancelled = true;
      if (skeletonTimer) {
        clearTimeout(skeletonTimer);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, detailPageInfo]);

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
    <header className="fixed inset-x-0 top-0 z-40 bg-background md:left-64 md:w-[calc(100%-16rem)]">
      <div className="pt-[var(--app-safe-top)]">
        <div className="flex h-[var(--app-header-height)] items-center justify-between border-b px-4 md:px-6 box-border">
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
                {showSkeleton ? (
                  <Skeleton className="h-5 w-32" />
                ) : entityName ? (
                  <span className="text-base font-semibold truncate">{entityName}</span>
                ) : null}
              </div>
            ) : (
              <span className="text-base font-semibold truncate">{sectionTitle}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {canCreate && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCreateClick}
                  aria-label={createLabelMap[pathname] || "Добавить"}
                  className="md:hidden"
                >
                  <Plus className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
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
