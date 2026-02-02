"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/lib/settings/context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { useUser } from "@/lib/users/context";
import { EntityTypesManager, type EntityTypesManagerRef } from "@/components/managers/entity-types-manager";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const { isLoading, error } = useSettings();
  const containerTypesManagerRef = useRef<EntityTypesManagerRef>(null);
  const placeTypesManagerRef = useRef<EntityTypesManagerRef>(null);
  const roomTypesManagerRef = useRef<EntityTypesManagerRef>(null);
  const itemTypesManagerRef = useRef<EntityTypesManagerRef>(null);


  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/");
    }
  }, [isUserLoading, user, router]);

  if (isLoading || isUserLoading) {
    return (
      <div className="space-y-4">
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

          </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-4">
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
                </div>
                <Button
                  variant="outline"
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
              />
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
                </div>
                <Button
                  variant="outline"
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
              />
            </CardContent>
          </Card>

        </div>

        {/* Раздел: Помещения */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Помещения</h2>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Типы помещений</CardTitle>
                </div>
                <Button
                  variant="outline"
                  onClick={() => roomTypesManagerRef.current?.openAddDialog()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить тип
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <EntityTypesManager
                ref={roomTypesManagerRef}
                category="room"
              />
            </CardContent>
          </Card>

        </div>

        {/* Раздел: Вещи */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Вещи</h2>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Типы вещей</CardTitle>
                </div>
                <Button
                  variant="outline"
                  onClick={() => itemTypesManagerRef.current?.openAddDialog()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить тип
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <EntityTypesManager
                ref={itemTypesManagerRef}
                category="item"
              />
            </CardContent>
          </Card>

        </div>
    </div>
  );
}
