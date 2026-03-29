"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { searchApiClient } from "@/lib/shared/api/search";
import { logError } from "@/lib/shared/logger";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Building2,
  Container,
  DoorOpen,
  LayoutGrid,
  Loader2,
  Package,
  ScanSearch,
  Search,
  Sofa,
} from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { PageHeader } from "@/components/layout/page-header";
import { CameraCaptureDialog } from "@/components/common/camera-capture-dialog";
import { toast } from "sonner";
import type { SearchHit, SearchMode } from "@/lib/search/types";
import { SearchResultsSection } from "@/components/search/search-results-section";
import { SearchSessionBanner } from "@/components/search/search-session-banner";

interface ActiveSearchSession {
  mode: SearchMode;
  previewUrl?: string | null;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPhotoSearchOpen, setIsPhotoSearchOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<ActiveSearchSession | null>(
    null
  );
  const [totalCount, setTotalCount] = useState(0);
  const activeTextSearchAbortRef = useRef<AbortController | null>(null);

  const clearSearchSession = useCallback(() => {
    setSearchResults([]);
    setTotalCount(0);
    setActiveSession((prev) => {
      if (prev?.previewUrl) {
        URL.revokeObjectURL(prev.previewUrl);
      }
      return null;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (activeSession?.previewUrl) {
        URL.revokeObjectURL(activeSession.previewUrl);
      }
    };
  }, [activeSession?.previewUrl]);

  const performTextSearch = useCallback(async (queryToSearch: string, signal: AbortSignal) => {
    const trimmedQuery = queryToSearch.trim();
    if (!trimmedQuery) {
      setSearchResults([]);
      setTotalCount(0);
      return;
    }

    setIsSearching(true);

    try {
      const response = await searchApiClient.searchText(trimmedQuery, { signal });
      setSearchResults(response.data);
      setTotalCount(response.totalCount);
      setActiveSession({ mode: "text" });
    } catch (error) {
      if (signal.aborted) {
        return;
      }
      logError("Ошибка поиска:", error);
      setSearchResults([]);
      setTotalCount(0);
    } finally {
      if (!signal.aborted) {
        setIsSearching(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      activeTextSearchAbortRef.current?.abort();
      activeTextSearchAbortRef.current = null;
      setIsSearching(false);
      clearSearchSession();
      return;
    }

    setActiveSession((prev) => {
      if (prev?.mode === "image") {
        return prev;
      }
      return { mode: "text" };
    });
    setIsSearching(true);

    activeTextSearchAbortRef.current?.abort();
    const abortController = new AbortController();
    activeTextSearchAbortRef.current = abortController;

    const timer = setTimeout(() => {
      void performTextSearch(searchQuery, abortController.signal);
    }, 300);

    return () => {
      clearTimeout(timer);
      abortController.abort();
      if (activeTextSearchAbortRef.current === abortController) {
        activeTextSearchAbortRef.current = null;
      }
    };
  }, [clearSearchSession, performTextSearch, searchQuery]);

  const handlePhotoSearchCapture = useCallback(
    async (blob: Blob) => {
      const file =
        blob instanceof File
          ? blob
          : new File([blob], "home-photo-search.jpg", {
              type: blob.type || "image/jpeg",
            });

      const previewUrl = URL.createObjectURL(file);
      setSearchQuery("");
      setSearchResults([]);
      setTotalCount(0);
      setIsSearching(true);
      setActiveSession((prev) => {
        if (prev?.previewUrl) {
          URL.revokeObjectURL(prev.previewUrl);
        }
        return {
          mode: "image",
          previewUrl,
        };
      });

      try {
        const result = await searchApiClient.searchByPhoto(file);
        setSearchResults(result.data);
        setTotalCount(result.totalCount);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Не удалось выполнить поиск по фото";
        toast.error(message);
        clearSearchSession();
      } finally {
        setIsSearching(false);
      }
    },
    [clearSearchSession]
  );

  const quickActions = [
    {
      label: "Вещи",
      icon: Package,
      href: "/items",
      description: "Просмотр всех вещей",
    },
    {
      label: "Места",
      icon: LayoutGrid,
      href: "/places",
      description: "Просмотр всех мест",
    },
    {
      label: "Контейнеры",
      icon: Container,
      href: "/containers",
      description: "Просмотр всех контейнеров",
    },
    {
      label: "Помещения",
      icon: DoorOpen,
      href: "/rooms",
      description: "Просмотр всех помещений",
    },
    {
      label: "Здания",
      icon: Building2,
      href: "/buildings",
      description: "Просмотр всех зданий",
    },
    {
      label: "Мебель",
      icon: Sofa,
      href: "/furniture",
      description: "Просмотр всей мебели",
    },
  ];

  const isTextQueryActive = searchQuery.trim().length > 0;
  const isSearchActive = activeSession != null || isTextQueryActive;
  const effectiveMode: SearchMode | null = activeSession?.mode ?? (isTextQueryActive ? "text" : null);
  const isPhotoSearchActive = effectiveMode === "image";
  const searchTitle =
    effectiveMode === "image" ? "Результаты поиска по фото" : "Результаты поиска";
  const emptyMessage =
    effectiveMode === "image"
      ? "Похожих вещей не найдено"
      : `Ничего не найдено по запросу "${searchQuery.trim()}"`;
  const bannerStatusText = isSearching
    ? effectiveMode === "image"
      ? "Ищем похожие вещи..."
      : `Ищем по запросу "${searchQuery.trim()}"...`
    : effectiveMode === "image"
      ? totalCount > 0
        ? `Найдено ${totalCount} результатов по фото`
        : "Похожих вещей не найдено"
      : totalCount > 0
        ? `Найдено ${totalCount} результатов`
        : `Ничего не найдено по запросу "${searchQuery.trim()}"`;
  const bannerDescription =
    effectiveMode === "image"
      ? "Поиск по фото использует единый search pipeline и нормализованные карточки результатов."
      : "";

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Поиск" />

      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <InputGroup>
            <InputGroupInput
              onChange={(e) => {
                if (isPhotoSearchActive) {
                  clearSearchSession();
                }
                setSearchQuery(e.target.value);
              }}
              value={searchQuery}
              placeholder="Введите название вещи, места, контейнера, мебели или помещения..."
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </div>
        <Button
          type="button"
          variant={isPhotoSearchActive ? "default" : "outline"}
          onClick={() => setIsPhotoSearchOpen(true)}
          disabled={isSearching && isPhotoSearchActive}
        >
          {isSearching && isPhotoSearchActive ? (
            <Loader2 className="animate-spin" data-icon="inline-start" />
          ) : (
            <ScanSearch data-icon="inline-start" />
          )}
          <span className="hidden sm:inline">Поиск по фото</span>
        </Button>
      </div>

      {isSearchActive && effectiveMode && (
        <SearchSessionBanner
          mode={effectiveMode}
          previewUrl={activeSession?.previewUrl ?? null}
          statusText={bannerStatusText}
          description={bannerDescription}
          onReset={() => {
            clearSearchSession();
            setSearchQuery("");
          }}
        />
      )}

      {isSearchActive && effectiveMode && (
        <SearchResultsSection
          title={searchTitle}
          hits={searchResults}
          isLoading={isSearching}
          mode={effectiveMode}
          emptyMessage={emptyMessage}
        />
      )}

      {!searchQuery && !isSearchActive && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className="group">
              <Card className="group-hover:bg-primary/10">
                <CardHeader className="pb-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <action.icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-lg">{action.label}</CardTitle>
                  <CardDescription className="text-sm">
                    {action.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CameraCaptureDialog
        open={isPhotoSearchOpen}
        onClose={() => setIsPhotoSearchOpen(false)}
        onCapture={handlePhotoSearchCapture}
        title="Поиск по фото"
        hint="Наведите камеру на предмет или загрузите готовую фотографию"
        uploadLabel="Загрузить"
        captureLabel="Найти"
      />
    </div>
  );
}
