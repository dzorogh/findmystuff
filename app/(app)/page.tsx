"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { searchApiClient } from "@/lib/shared/api/search";
import { logError } from "@/lib/shared/logger";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Package, LayoutGrid, Container, DoorOpen, Sofa, ArrowRight, Loader2, ScanSearch, X } from "lucide-react";
import type { Item, SearchResult } from "@/types/entity";
import Link from "next/link";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { PageHeader } from "@/components/layout/page-header";
import { CameraCaptureDialog } from "@/components/common/camera-capture-dialog";
import { itemPhotoSearchApiClient } from "@/lib/shared/api/item-photo-search";
import { toast } from "sonner";

const ENTITY_CONFIG = {
  item: { Icon: Package, label: "Вещи" },
  place: { Icon: LayoutGrid, label: "Места" },
  container: { Icon: Container, label: "Контейнеры" },
  room: { Icon: DoorOpen, label: "Помещения" },
  furniture: { Icon: Sofa, label: "Мебель" },
} as const;

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPhotoSearchOpen, setIsPhotoSearchOpen] = useState(false);
  const [isPhotoSearching, setIsPhotoSearching] = useState(false);
  const [photoSearchResults, setPhotoSearchResults] = useState<Item[]>([]);
  const [photoSearchPreviewUrl, setPhotoSearchPreviewUrl] = useState<string | null>(null);
  const [photoSearchTotalCount, setPhotoSearchTotalCount] = useState(0);
  const [photoSearchNoMatches, setPhotoSearchNoMatches] = useState(false);
  const router = useRouter();

  const clearPhotoSearch = useCallback(() => {
    setPhotoSearchResults([]);
    setPhotoSearchTotalCount(0);
    setPhotoSearchNoMatches(false);
    setPhotoSearchPreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (photoSearchPreviewUrl) {
        URL.revokeObjectURL(photoSearchPreviewUrl);
      }
    };
  }, [photoSearchPreviewUrl]);

  const performSearch = async (queryToSearch: string) => {
    if (!queryToSearch.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      const response = await searchApiClient.search(queryToSearch.trim());
      // API возвращает { data: SearchResult[] }
      // request возвращает это напрямую, поэтому response будет { data: SearchResult[] }
      // И response.data будет SearchResult[]
      setSearchResults(response.data || []);
    } catch (error) {
      logError("Ошибка поиска:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePhotoSearchCapture = useCallback(
    async (blob: Blob) => {
      const file =
        blob instanceof File
          ? blob
          : new File([blob], "home-photo-search.jpg", {
              type: blob.type || "image/jpeg",
            });

      const previewUrl = URL.createObjectURL(file);
      setPhotoSearchPreviewUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return previewUrl;
      });
      setSearchQuery("");
      setSearchResults([]);
      setIsPhotoSearching(true);

      try {
        const result = await itemPhotoSearchApiClient.search({ file });
        setPhotoSearchResults(result.data);
        setPhotoSearchTotalCount(result.totalCount);
        setPhotoSearchNoMatches(result.noSimilarFound);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Не удалось выполнить поиск по фото";
        toast.error(message);
        clearPhotoSearch();
      } finally {
        setIsPhotoSearching(false);
      }
    },
    [clearPhotoSearch]
  );

  const getIcon = (type: string) => {
    const config = ENTITY_CONFIG[type as keyof typeof ENTITY_CONFIG];
    if (!config) return null;
    const Icon = config.Icon;
    return <Icon className="h-4 w-4" />;
  };

  const getTypeLabel = (type: string) => ENTITY_CONFIG[type as keyof typeof ENTITY_CONFIG]?.label ?? type;

  const getLocationDetails = (result: SearchResult) => {
    const details = [
      {
        key: "room",
        label: "Помещение",
        Icon: DoorOpen,
        value: result.room_name,
      },
      {
        key: "furniture",
        label: "Мебель",
        Icon: Sofa,
        value: result.furniture_name,
      },
      {
        key: "place",
        label: "Место",
        Icon: LayoutGrid,
        value: result.place_name,
      },
      {
        key: "container",
        label: "Контейнер",
        Icon: Container,
        value: result.container_name,
      },
    ].filter((detail) => detail.value?.trim());

    if (details.length > 0) {
      return details;
    }

    if (!result.location || !result.locationType) {
      return [];
    }

    if (result.locationType === "room") {
      return [{ key: "room", label: "Помещение", Icon: DoorOpen, value: result.location }];
    }

    if (result.locationType === "furniture") {
      return [{ key: "furniture", label: "Мебель", Icon: Sofa, value: result.location }];
    }

    if (result.locationType === "place") {
      return [{ key: "place", label: "Место", Icon: LayoutGrid, value: result.location }];
    }

    return [{ key: "container", label: "Контейнер", Icon: Container, value: result.location }];
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === "item") {
      router.push(`/items/${result.id}`);
    } else if (result.type === "place") {
      router.push(`/places/${result.id}`);
    } else if (result.type === "container") {
      router.push(`/containers/${result.id}`);
    } else if (result.type === "room") {
      router.push(`/rooms/${result.id}`);
    } else if (result.type === "furniture") {
      router.push(`/furniture/${result.id}`);
    }
  };

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
      label: "Мебель",
      icon: Sofa,
      href: "/furniture",
      description: "Просмотр всей мебели",
    },
  ];
  const isPhotoSearchActive =
    photoSearchPreviewUrl != null || isPhotoSearching || photoSearchResults.length > 0;

  return (
    <div className="flex flex-col gap-4">

      <PageHeader title="Поиск" />

      {/* Поиск */}
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <InputGroup>
            <InputGroupInput
              onChange={(e) => {
                if (isPhotoSearchActive) {
                  clearPhotoSearch();
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
          disabled={isPhotoSearching}
        >
          {isPhotoSearching ? (
            <Loader2 className="animate-spin" data-icon="inline-start" />
          ) : (
            <ScanSearch data-icon="inline-start" />
          )}
          <span className="hidden sm:inline">Поиск по фото</span>
        </Button>
      </div>

      {isPhotoSearchActive && (
        <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            {photoSearchPreviewUrl && (
              <div className="relative h-16 w-16 overflow-hidden rounded-md border bg-muted">
                <Image
                  src={photoSearchPreviewUrl}
                  alt="Фото для поиска"
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-medium">
                {isPhotoSearching
                  ? "Ищем похожие вещи..."
                  : photoSearchNoMatches
                    ? "Похожих вещей не найдено"
                    : `Найдено ${photoSearchTotalCount} похожих вещей`}
              </p>
              <p className="text-sm text-muted-foreground">
                Поиск учитывает и фото вещей, и умные совпадения по их названию.
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" onClick={clearPhotoSearch}>
            <X data-icon="inline-start" />
            Сбросить поиск по фото
          </Button>
        </Card>
      )}

      {/* Результаты поиска */}
      {searchQuery && !isPhotoSearchActive && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold">
              Результаты поиска
              {searchResults.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({searchResults.length})
                </span>
              )}
            </h2>
          </div>

          {searchResults.length === 0 && !isSearching ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Ничего не найдено по запросу &quot;{searchQuery}&quot;
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
              {searchResults.map((result) => (
                <Card
                  key={`${result.type}-${result.id}`}
                  className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                  onClick={() => handleResultClick(result)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getIcon(result.type)}
                        <CardTitle className="text-lg">
                          {result.name || `${getTypeLabel(result.type)} #${result.id}`}
                        </CardTitle>
                      </div>
                      <Badge variant="secondary">{getTypeLabel(result.type)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {getLocationDetails(result).length > 0 && (
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {getLocationDetails(result).map(({ key, label, Icon, value }) => (
                          <div key={key} className="flex items-center gap-2">
                            <Icon className="h-3 w-3 flex-shrink-0" />
                            <span>{label}: {value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex items-center text-sm text-primary">
                      Открыть
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {isPhotoSearchActive && !isPhotoSearching && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold">
              Результаты поиска по фото
              {photoSearchResults.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({photoSearchResults.length})
                </span>
              )}
            </h2>
          </div>

          {photoSearchResults.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ScanSearch className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Похожих вещей не найдено
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {photoSearchResults.map((item) => (
                <Card
                  key={item.id}
                  className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
                  onClick={() => router.push(`/items/${item.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="text-lg">
                          {item.name || `Вещь #${item.id}`}
                        </CardTitle>
                        {item.item_type?.name && (
                          <CardDescription>{item.item_type.name}</CardDescription>
                        )}
                      </div>
                      <Badge variant="secondary">
                        {item.search_match?.source === "image"
                          ? "Совпадение по фото"
                          : "Умное совпадение"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {item.last_location?.room_name && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DoorOpen className="h-3 w-3 flex-shrink-0" />
                        <span>Помещение: {item.last_location.room_name}</span>
                      </div>
                    )}
                    {item.search_match && (
                      <div className="mt-3">
                        <Badge variant="outline">
                          Релевантность {Math.round(item.search_match.similarity * 100)}%
                        </Badge>
                      </div>
                    )}
                    <div className="mt-3 flex items-center text-sm text-primary">
                      Открыть вещь
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Быстрые действия */}
      {!searchQuery && !isPhotoSearchActive && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className="group">
              <Card className="group-hover:bg-primary/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <action.icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-lg">{action.label}</CardTitle>
                  <CardDescription className="text-sm">{action.description}</CardDescription>
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
