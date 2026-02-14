"use client";

import { useRef } from "react";
import { useSettings } from "@/lib/settings/context";
import { Card, CardContent } from "@/components/ui/card";
import { EntitySection } from "@/components/settings/entity-section";
import type { EntityTypesManagerRef } from "@/components/managers/entity-types-manager";
import { PageHeader } from "@/components/layout/page-header";

export default function SettingsPage() {
  const { error } = useSettings();
  const buildingTypesManagerRef = useRef<EntityTypesManagerRef>(null);
  const containerTypesManagerRef = useRef<EntityTypesManagerRef>(null);
  const placeTypesManagerRef = useRef<EntityTypesManagerRef>(null);
  const roomTypesManagerRef = useRef<EntityTypesManagerRef>(null);
  const itemTypesManagerRef = useRef<EntityTypesManagerRef>(null);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Настройки" />

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <EntitySection
        title="Здания"
        cardTitle="Типы зданий"
        category="building"
        managerRef={buildingTypesManagerRef}
      />

      <EntitySection
        title="Контейнеры"
        cardTitle="Типы контейнеров"
        category="container"
        managerRef={containerTypesManagerRef}
      />

      <EntitySection
        title="Места"
        cardTitle="Типы мест"
        category="place"
        managerRef={placeTypesManagerRef}
      />

      <EntitySection
        title="Помещения"
        cardTitle="Типы помещений"
        category="room"
        managerRef={roomTypesManagerRef}
      />

      <EntitySection
        title="Вещи"
        cardTitle="Типы вещей"
        category="item"
        managerRef={itemTypesManagerRef}
      />
    </div>
  );
}
