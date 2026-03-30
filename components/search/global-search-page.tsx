"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, ScanSearch, Search } from "lucide-react";
import { searchApiClient } from "@/lib/shared/api/search";
import { logError } from "@/lib/shared/logger";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { PageHeader } from "@/components/layout/page-header";
import { CameraCaptureDialog } from "@/components/common/camera-capture-dialog";
import { toast } from "sonner";
import type { SearchHit, SearchMode } from "@/lib/search/types";
import { SearchResultsSection } from "@/components/search/search-results-section";
import { SearchSessionBanner } from "@/components/search/search-session-banner";
import { SearchEmptyState } from "@/components/search/search-empty-state";

interface ActiveSearchSession {
  mode: SearchMode;
  previewUrl?: string | null;
}

export function GlobalSearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPhotoSearchOpen, setIsPhotoSearchOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<ActiveSearchSession | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const searchRequestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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

  const performTextSearch = useCallback(
    async (queryToSearch: string) => {
      const trimmedQuery = queryToSearch.trim();
      if (!trimmedQuery) {
        setSearchResults([]);
        setTotalCount(0);
        return;
      }

      const requestId = ++searchRequestIdRef.current;
      setIsSearching(true);

      try {
        const response = await searchApiClient.searchText(trimmedQuery);

        // Ignore stale results
        if (requestId !== searchRequestIdRef.current || !isMountedRef.current) {
          return;
        }

        setSearchResults(response.data);
        setTotalCount(response.totalCount);
        setActiveSession({ mode: "text" });
      } catch (error) {
        if (requestId !== searchRequestIdRef.current || !isMountedRef.current) {
          return;
        }

        logError("Ошибка поиска:", error);
        setSearchResults([]);
        setTotalCount(0);
      } finally {
        if (requestId === searchRequestIdRef.current && isMountedRef.current) {
          setIsSearching(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!searchQuery.trim()) {
      searchRequestIdRef.current++;
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

    const timer = setTimeout(() => {
      void performTextSearch(searchQuery);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [clearSearchSession, performTextSearch, searchQuery]);

  const handlePhotoSearchCapture = useCallback(
    async (blob: Blob) => {
      const file =
        blob instanceof File
          ? blob
          : new File([blob], "search-photo.jpg", {
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
  const bannerDescription = "";

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Поиск" />

      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <InputGroup>
            <InputGroupInput
              autoFocus
              onChange={(event) => {
                if (isPhotoSearchActive) {
                  clearSearchSession();
                }

                setSearchQuery(event.target.value);
              }}
              value={searchQuery}
              placeholder="Введите название вещи или контейнера..."
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

      {isSearchActive && effectiveMode ? (
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
      ) : null}

      {isSearchActive && effectiveMode ? (
        <SearchResultsSection
          title={searchTitle}
          hits={searchResults}
          isLoading={isSearching}
          mode={effectiveMode}
          emptyMessage={emptyMessage}
        />
      ) : (
        <SearchEmptyState onSuggest={setSearchQuery} />
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
