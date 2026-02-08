"use client";

import type { RefObject } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EntityTypesManager, type EntityTypesManagerRef } from "@/components/managers/entity-types-manager";

export type EntityCategory = "container" | "place" | "room" | "item";

interface EntitySectionProps {
  title: string;
  cardTitle: string;
  category: EntityCategory;
  managerRef: RefObject<EntityTypesManagerRef | null>;
}

export function EntitySection({ title, cardTitle, category, managerRef }: EntitySectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{cardTitle}</CardTitle>
            </div>
            <Button
              variant="outline"
              onClick={() => managerRef.current?.openAddDialog()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить тип
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <EntityTypesManager ref={managerRef} category={category} />
        </CardContent>
      </Card>
    </div>
  );
}
