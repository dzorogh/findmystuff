"use client";

import { useRef } from "react";
import { useSettings } from "@/lib/settings/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EntityTypesManager, type EntityTypesManagerRef } from "@/components/managers/entity-types-manager";
import { PageHeader } from "@/components/layout/page-header";

export default function SettingsPage() {
  const { error } = useSettings();
  const containerTypesManagerRef = useRef<EntityTypesManagerRef>(null);
  const placeTypesManagerRef = useRef<EntityTypesManagerRef>(null);
  const roomTypesManagerRef = useRef<EntityTypesManagerRef>(null);
  const itemTypesManagerRef = useRef<EntityTypesManagerRef>(null);

  return (
    <div className="flex flex-col gap-2">
      <PageHeader title="Настройки" />

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Раздел: Контейнеры */}
      <div className="flex flex-col gap-2">
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
            />
          </CardContent>
        </Card>

      </div>

      {/* Раздел: Места */}
      <div className="flex flex-col gap-2">
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
      <div className="flex flex-col gap-2">
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
      <div className="flex flex-col gap-2">
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
