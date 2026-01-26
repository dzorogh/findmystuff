"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/hooks/use-settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { EntityTypesManager, type EntityTypesManagerRef } from "@/components/managers/entity-types-manager";
import MarkingTemplateManager from "@/components/managers/marking-template-manager";
import PlaceMarkingTemplateManager from "@/components/managers/place-marking-template-manager";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const { isLoading, error } = useSettings();
  const containerTypesManagerRef = useRef<EntityTypesManagerRef>(null);
  const placeTypesManagerRef = useRef<EntityTypesManagerRef>(null);


  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/");
    }
  }, [isUserLoading, user, router]);

  if (isLoading || isUserLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Раздел: Контейнеры */}
          <div className="space-y-4">
            <Skeleton className="h-7 w-32" />
            
            {/* Типы контейнеров */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-64 mt-2" />
                  </div>
                  <Skeleton className="h-9 w-32" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>

            {/* Шаблон маркировки контейнеров */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-4 w-64 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Раздел: Места */}
          <div className="space-y-4">
            <Skeleton className="h-7 w-24" />
            
            {/* Типы мест */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-64 mt-2" />
                  </div>
                  <Skeleton className="h-9 w-32" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>

            {/* Шаблон маркировки мест */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mx-auto max-w-4xl space-y-6">
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Раздел: Контейнеры */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Контейнеры</h2>
          </div>

          {/* Типы контейнеров */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Типы контейнеров</CardTitle>
                  <CardDescription>
                    Управление типами контейнеров для системы маркировки
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => containerTypesManagerRef.current?.openAddDialog()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить тип
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <EntityTypesManager
                ref={containerTypesManagerRef}
                category="container"
                title="Типы контейнеров"
                description="Управление типами контейнеров для системы маркировки"
              />
            </CardContent>
          </Card>

          {/* Шаблон маркировки контейнеров */}
          <Card>
            <CardHeader>
              <CardTitle>Шаблон маркировки контейнеров</CardTitle>
              <CardDescription>
                Настройка формата маркировки для контейнеров
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MarkingTemplateManager />
            </CardContent>
          </Card>
        </div>

        {/* Раздел: Места */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Места</h2>
          </div>

          {/* Типы мест */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Типы мест</CardTitle>
                  <CardDescription>
                    Управление типами мест для системы маркировки
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => placeTypesManagerRef.current?.openAddDialog()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить тип
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <EntityTypesManager
                ref={placeTypesManagerRef}
                category="place"
                title="Типы мест"
                description="Управление типами мест для системы маркировки"
              />
            </CardContent>
          </Card>

          {/* Шаблон маркировки мест */}
          <Card>
            <CardHeader>
              <CardTitle>Шаблон маркировки мест</CardTitle>
              <CardDescription>
                Настройка формата маркировки для мест
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlaceMarkingTemplateManager />
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
