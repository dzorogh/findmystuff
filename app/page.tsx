"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Package, MapPin, Container, Building2, Plus, ArrowRight } from "lucide-react";
import AddItemForm from "@/components/add-item-form";

interface SearchResult {
  type: "item" | "place" | "container";
  id: number;
  name: string | null;
  location?: string;
  locationType?: "place" | "container";
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Ошибка получения пользователя:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const performSearch = async (queryToSearch: string) => {
    if (!user || !queryToSearch.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const supabase = createClient();
      const query = queryToSearch.trim();

        // Поиск по вещам, местам, контейнерам и помещениям параллельно
        const [itemsResult, placesResult, containersResult, roomsResult] = await Promise.all([
          supabase
            .from("items")
            .select("id, name")
            .ilike("name", `%${query}%`)
            .is("deleted_at", null)
            .limit(10),
          supabase
            .from("places")
            .select("id, name")
            .ilike("name", `%${query}%`)
            .is("deleted_at", null)
            .limit(10),
          supabase
            .from("containers")
            .select("id, name")
            .ilike("name", `%${query}%`)
            .is("deleted_at", null)
            .limit(10),
          supabase
            .from("rooms")
            .select("id, name")
            .ilike("name", `%${query}%`)
            .is("deleted_at", null)
            .limit(10),
        ]);

      const results: SearchResult[] = [];

      // Добавляем вещи с их местоположениями
      if (itemsResult.data) {
        const itemIds = itemsResult.data.map((item) => item.id);
        
        // Получаем последние переходы для найденных вещей
        const { data: transitions } = await supabase
          .from("transitions")
          .select("*")
          .in("item_id", itemIds)
          .order("created_at", { ascending: false });

        // Группируем по item_id и берем последний
        const lastTransitions = new Map<number, any>();
        transitions?.forEach((t) => {
          if (!lastTransitions.has(t.item_id)) {
            lastTransitions.set(t.item_id, t);
          }
        });

          // Получаем названия мест, контейнеров и помещений
          const placeIds = Array.from(lastTransitions.values())
            .filter((t) => t.destination_type === "place")
            .map((t) => t.destination_id);
          const containerIds = Array.from(lastTransitions.values())
            .filter((t) => t.destination_type === "container")
            .map((t) => t.destination_id);
          const roomIds = Array.from(lastTransitions.values())
            .filter((t) => t.destination_type === "room")
            .map((t) => t.destination_id);

          const [placesData, containersData, roomsData] = await Promise.all([
            placeIds.length > 0
              ? supabase.from("places").select("id, name").in("id", placeIds)
              : { data: [] },
            containerIds.length > 0
              ? supabase.from("containers").select("id, name").in("id", containerIds)
              : { data: [] },
            roomIds.length > 0
              ? supabase.from("rooms").select("id, name").in("id", roomIds)
              : { data: [] },
          ]);

          const placesMap = new Map(
            (placesData.data || []).map((p) => [p.id, p.name])
          );
          const containersMap = new Map(
            (containersData.data || []).map((c) => [c.id, c.name])
          );
          const roomsMap = new Map(
            (roomsData.data || []).map((r) => [r.id, r.name])
          );

        itemsResult.data.forEach((item) => {
          const transition = lastTransitions.get(item.id);
          let location: string | undefined;
          let locationType: "place" | "container" | undefined;

            if (transition) {
              if (transition.destination_type === "place") {
                location = placesMap.get(transition.destination_id) || undefined;
                locationType = "place";
              } else if (transition.destination_type === "container") {
                location = containersMap.get(transition.destination_id) || undefined;
                locationType = "container";
              } else if (transition.destination_type === "room") {
                location = roomsMap.get(transition.destination_id) || undefined;
                locationType = "room";
              }
            }

          results.push({
            type: "item",
            id: item.id,
            name: item.name,
            location,
            locationType,
          });
        });
      }

      // Добавляем места
      if (placesResult.data) {
        placesResult.data.forEach((place) => {
          results.push({
            type: "place",
            id: place.id,
            name: place.name,
          });
        });
      }

        // Добавляем контейнеры
        if (containersResult.data) {
          containersResult.data.forEach((container) => {
            results.push({
              type: "container",
              id: container.id,
              name: container.name,
            });
          });
        }

        // Добавляем помещения
        if (roomsResult.data) {
          roomsResult.data.forEach((room) => {
            results.push({
              type: "room",
              id: room.id,
              name: room.name,
            });
          });
        }

        setSearchResults(results);
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
  }, [searchQuery, user]);

  const handleItemAdded = () => {
    // Обновляем поиск, если есть активный запрос
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  };

  if (isLoading) {
    return (
      <div className="container flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">FindMyStuff</CardTitle>
            <CardDescription>
              Войдите, чтобы начать вести учет ваших вещей
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Приложение для быстрого поиска и учета вещей в домашнем складе
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "item":
        return <Package className="h-4 w-4" />;
      case "place":
        return <MapPin className="h-4 w-4" />;
      case "container":
        return <Container className="h-4 w-4" />;
      case "room":
        return <Building2 className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "item":
        return "Вещь";
      case "place":
        return "Место";
      case "container":
        return "Контейнер";
      case "room":
        return "Помещение";
      default:
        return type;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === "item") {
      router.push("/items");
    } else if (result.type === "place") {
      router.push("/places");
    } else if (result.type === "container") {
      router.push("/containers");
    } else if (result.type === "room") {
      router.push("/rooms");
    }
  };

  return (
    <div className="container py-8 px-4">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Заголовок и поиск */}
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Найти вещь</h1>
            <p className="text-muted-foreground">
              Быстрый поиск по вещам, местам и контейнерам
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Введите название вещи, места, контейнера или помещения..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base"
                  autoFocus
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Результаты поиска */}
        {searchQuery && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
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
              <div className="grid gap-4 md:grid-cols-2">
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
                        <MapPin className="h-3 w-3" />
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50" onClick={() => router.push("/items")}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  <CardTitle>Вещи</CardTitle>
                </div>
                <CardDescription>Просмотр всех вещей</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full justify-between">
                  Открыть
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50" onClick={() => router.push("/places")}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <CardTitle>Места</CardTitle>
                </div>
                <CardDescription>Просмотр всех мест</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full justify-between">
                  Открыть
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50" onClick={() => router.push("/containers")}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Container className="h-5 w-5" />
                  <CardTitle>Контейнеры</CardTitle>
                </div>
                <CardDescription>Просмотр всех контейнеров</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full justify-between">
                  Открыть
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50" onClick={() => router.push("/rooms")}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  <CardTitle>Помещения</CardTitle>
                </div>
                <CardDescription>Просмотр всех помещений</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full justify-between">
                  Открыть
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Форма добавления вещи */}
        {user.email === "dzorogh@gmail.com" && (
          <div className="flex justify-center">
            <Button onClick={() => setIsAddItemDialogOpen(true)} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Добавить новую вещь
            </Button>
            <AddItemForm
              open={isAddItemDialogOpen}
              onOpenChange={setIsAddItemDialogOpen}
              onSuccess={handleItemAdded}
            />
          </div>
        )}
      </div>
    </div>
  );
}
