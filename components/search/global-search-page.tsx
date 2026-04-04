"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, ScanSearch, Search, PlusCircle, PackageSearch } from "lucide-react";
import { searchApiClient } from "@/lib/shared/api/search";
import { logError } from "@/lib/shared/logger";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { PageHeader } from "@/components/layout/page-header";
import { CameraCaptureDialog } from "@/components/common/camera-capture-dialog";
import { toast } from "sonner";
import type { SearchHit, SearchMode } from "@/lib/search/types";
import { SearchResultsSection } from "@/components/search/search-results-section";
import { SearchSessionBanner } from "@/components/search/search-session-banner";
import { SearchEmptyState } from "@/components/search/search-empty-state";
import { useAddItem } from "@/lib/app/contexts/add-item-context";

interface ActiveSearchSession {
  mode: SearchMode;
  previewUrl?: string | null;
  file?: File;
}

export function GlobalSearchPage() {
  const addItemContext = useAddItem();
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
          file,
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
    <div className={cn("flex flex-col w-full mx-auto transition-all duration-500", isSearchActive ? "gap-4" : "gap-8 mt-[10vh] max-w-3xl")}>
      {!isSearchActive && (
         <div className="flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative mb-6">
              <div className="absolute inset-0 -m-4 rounded-full bg-primary/5 blur-2xl" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border bg-background/50 shadow-sm backdrop-blur">
                <PackageSearch className="h-10 w-10 text-primary/60" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Поиск вещей</h1>
            <p className="max-w-md text-balance text-muted-foreground">
              Начните вводить название вещи или контейнера, либо воспользуйтесь поиском по фото для быстрого нахождения.
            </p>
         </div>
      )}

      {isSearchActive && <PageHeader title="Поиск" />}

      <div className={cn("flex items-center relative transition-all duration-300 z-10", isSearchActive ? "" : "shadow-lg hover:shadow-xl rounded-[1.25rem] group")}>
          <InputGroup className={cn("w-full border-border/60 transition-all", isSearchActive ? "h-10 bg-background rounded-lg" : "h-14 sm:h-16 bg-background/80 backdrop-blur rounded-[1.25rem] dark:bg-muted/20")}>
            <InputGroupAddon align="inline-start">
               <Search className={cn("text-muted-foreground", isSearchActive ? "h-4 w-4" : "h-5 w-5 sm:h-6 sm:w-6 ml-1 sm:ml-2")} />
            </InputGroupAddon>
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
               className={cn("h-full border-0 focus-visible:ring-0", isSearchActive ? "text-sm" : "text-base sm:text-lg px-2")}
            />
            
            <div className="pr-1.5 sm:pr-2 flex items-center h-[calc(100%-8px)] my-1">
              <Button
                type="button"
                variant={isPhotoSearchActive ? "default" : "secondary"}
                onClick={() => setIsPhotoSearchOpen(true)}
                disabled={isSearching && isPhotoSearchActive}
                className={cn("h-full transition-all shadow-sm hover:shadow", isSearchActive ? "px-3 rounded-md" : "px-4 sm:px-6 rounded-xl")}
              >
                 {isSearching && isPhotoSearchActive ? (
                   <Loader2 className="animate-spin" data-icon="inline-start" />
                 ) : (
                   <ScanSearch className={cn(isSearchActive ? "mr-2 h-4 w-4" : "mr-2 h-4 w-4 sm:h-5 sm:w-5")} />
                 )}
                 <span className={cn(isSearchActive ? "hidden sm:inline text-sm" : "hidden sm:inline text-sm font-medium")}>
                   Поиск по фото
                 </span>
              </Button>
            </div>
          </InputGroup>
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
        <div className="flex flex-col gap-8 animate-in fade-in duration-300">
          <SearchResultsSection
            title={searchTitle}
            hits={searchResults}
            isLoading={isSearching}
            mode={effectiveMode}
            emptyMessage={emptyMessage}
          />
          {effectiveMode === "image" && !isSearching && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-gradient-to-br from-muted/40 via-background to-background p-8 text-center shadow-sm">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <PlusCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold tracking-tight text-foreground">
                Не нашли нужную вещь?
              </h3>
              <p className="mb-6 max-w-md text-sm text-muted-foreground/90 leading-relaxed">
                Добавьте новую вещь в каталог. Мы уже проанализировали ваше фото для автоматического заполнения названия и категории.
              </p>
              <Button
                size="lg"
                onClick={() => {
                  if (activeSession?.file) {
                    addItemContext.processPhotoAndOpenForm(activeSession.file).catch((e) => {
                      logError("Error in processPhotoAndOpenForm:", e);
                    });
                  }
                }}
                disabled={addItemContext.isRecognizeLoading}
                className="gap-2 font-medium shadow-sm transition-all hover:shadow-md"
              >
                {addItemContext.isRecognizeLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <PlusCircle className="h-5 w-5" />
                )}
                <span>Добавить вещь</span>
              </Button>
            </div>
          )}
        </div>
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
