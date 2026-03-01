"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { searchApiClient } from "@/lib/shared/api/search";
import { logError } from "@/lib/shared/logger";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Package, LayoutGrid, Container, DoorOpen, Sofa, ArrowRight } from "lucide-react";
import type { SearchResult } from "@/types/entity";
import Link from "next/link";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { PageHeader } from "@/components/layout/page-header";

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
  const router = useRouter();

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
  return (
    <div className="flex flex-col gap-4">

      <PageHeader title="Поиск" />

      {/* Поиск */}
      <InputGroup>
        <InputGroupInput
          onChange={(e) => setSearchQuery(e.target.value)}
          value={searchQuery}
          placeholder="Введите название вещи, места, контейнера, мебели или помещения..."
        />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
      </InputGroup>

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
                          <LayoutGrid className="h-3 w-3" />
                        ) : result.locationType === "container" ? (
                          <Container className="h-3 w-3" />
                        ) : (
                          <DoorOpen className="h-3 w-3" />
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
    </div>
  );
}
