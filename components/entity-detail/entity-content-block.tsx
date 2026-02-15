"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EntityContentList } from "./entity-content-list";

interface EntityContentListItem {
  id: number;
  name: string | null;
  photo_url?: string | null;
}

interface EntityContentBlockProps {
  title: string;
  description: string;
  items: EntityContentListItem[];
  entityType: "items" | "containers" | "places" | "rooms" | "furniture";
  emptyMessage: string;
  addButton?: {
    label: string;
    onClick: () => void;
  };
}

export function EntityContentBlock({
  title,
  description,
  items,
  entityType,
  emptyMessage,
  addButton,
}: EntityContentBlockProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {addButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={addButton.onClick}
            className="shrink-0"
          >
            <Plus className="h-4 w-4 mr-1" />
            {addButton.label}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <EntityContentList
          items={items}
          entityType={entityType}
          emptyMessage={emptyMessage}
        />
      </CardContent>
    </Card>
  );
}
