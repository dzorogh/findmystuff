"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { searchApi } from "@/lib/shared/api/search";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Warehouse, Container, Building2, ArrowRight } from "lucide-react";
import { useUser } from "@/lib/users/context";
import type { SearchResult } from "@/types/entity";

const ENTITY_CONFIG = {
  item: { Icon: Package, label: "Вещи" },
  place: { Icon: Warehouse, label: "Места" },
  container: { Icon: Container, label: "Контейнеры" },
  room: { Icon: Building2, label: "Помещения" },
} as const;

export default function Home() {
  const { user, isLoading } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const performSearch = async (queryToSearch: string) => {
    if (!user || !queryToSearch.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await searchApi.search(queryToSearch.trim());
      // API возвращает { data: SearchResult[] }
      // request возвращает это напрямую, поэтому response будет { data: SearchResult[] }
      // И response.data будет SearchResult[]
      setSearchResults(response.data || []);
    } catch (error) {
      console.error("Ошибка поиска:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (!user || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, user?.id]);


  if (isLoading) {
    return null;
  }

  if (!user) {
    return null;
  }

  const getIcon = (type: string) => {
    const config = ENTITY_CONFIG[type as keyof typeof ENTITY_CONFIG];
    if (!config) return null;
    const Icon = config.Icon;
    return <Icon className="h-4 w-4" />;
  };

  const getTypeLabel = (type: string) => ENTITY_CONFIG[type as keyof typeof ENTITY_CONFIG]?.label ?? type;

  const handleResultClick = (result: SearchResult) => {
    if (result.type === "item") {
      router.push(`/items/${result.id}`);
    } else if (result.type === "place") {
      router.push(`/places/${result.id}`);
    } else if (result.type === "container") {
      router.push(`/containers/${result.id}`);
    } else if (result.type === "room") {
      router.push(`/rooms/${result.id}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Поиск */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Введите название вещи, места, контейнера или помещения..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>
      </div>

      {/* Результаты поиска */}
      {searchQuery && (
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
                    {result.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {result.locationType === "place" ? (
                          <Warehouse className="h-3 w-3" />
                        ) : result.locationType === "container" ? (
                          <Container className="h-3 w-3" />
                        ) : (
                          <Building2 className="h-3 w-3" />
                        )}
                        <span>
                          {result.locationType === "place" ? "Место" : result.locationType === "container" ? "Контейнер" : "Помещение"}: {result.location}
                        </span>
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

      {/* Быстрые действия */}
      {!searchQuery && (
        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            className="group cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50 hover:-translate-y-1"
            onClick={() => router.push("/items")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <CardTitle className="text-lg">Вещи</CardTitle>
              <CardDescription className="text-sm">Просмотр всех вещей</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="group cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50 hover:-translate-y-1"
            onClick={() => router.push("/places")}
          >
            <CardHeader className="">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Warehouse className="h-5 w-5 text-primary" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <CardTitle className="text-lg">Места</CardTitle>
              <CardDescription className="text-sm">Просмотр всех мест</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="group cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50 hover:-translate-y-1"
            onClick={() => router.push("/containers")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Container className="h-5 w-5 text-primary" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <CardTitle className="text-lg">Контейнеры</CardTitle>
              <CardDescription className="text-sm">Просмотр всех контейнеров</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="group cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50 hover:-translate-y-1"
            onClick={() => router.push("/rooms")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <CardTitle className="text-lg">Помещения</CardTitle>
              <CardDescription className="text-sm">Просмотр всех помещений</CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
}
