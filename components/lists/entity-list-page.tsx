"use client";

import { Suspense, useCallback, useMemo } from "react";
import { ListPageContent } from "@/components/lists/list-page-content";
import { useListPage } from "@/lib/app/hooks/use-list-page";
import { resolveActions } from "@/lib/entities/resolve-actions";
import type { EntityConfig, EntityDisplay } from "@/types/entity";
import { createEntityListHandlers } from "@/lib/entities/create-entity-handlers";
import { usePrintEntityLabel } from "@/lib/entities/hooks/use-print-entity-label";
import { updateItem } from "@/lib/entities/api";
import { updateRoom } from "@/lib/rooms/api";
import { updatePlace } from "@/lib/places/api";
import { updateContainer } from "@/lib/containers/api";
import { updateBuilding } from "@/lib/buildings/api";
import { updateFurniture } from "@/lib/furniture/api";

export interface EntityListPageProps {
  config: EntityConfig;
}

function EntityListPageContent({ config }: EntityListPageProps) {
  const listPage = useListPage(config);
  const printLabel = usePrintEntityLabel(config.kind);
  const handlers = useMemo(
    () => createEntityListHandlers(config.apiTable, config.labels, listPage.refreshList),
    [config.apiTable, config.labels, listPage.refreshList]
  );
  const ctx = useMemo(
    () => ({
      refreshList: listPage.refreshList,
      printLabel: (id: number, name?: string | null) => printLabel(id, name ?? null),
      handleDelete: handlers.handleDelete,
      handleDuplicate: handlers.handleDuplicate,
      handleRestore: handlers.handleRestore,
    }),
    [listPage.refreshList, printLabel, handlers]
  );
  const getRowActions = useCallback(
    (entity: EntityDisplay) => resolveActions(config.actions, entity, ctx),
    [config.actions, ctx]
  );

  const handleRename = useCallback(
    async (entity: EntityDisplay, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed) return;
      switch (config.apiTable) {
        case "items":
          await updateItem(entity.id, { name: trimmed });
          break;
        case "rooms":
          await updateRoom(entity.id, { name: trimmed });
          break;
        case "places":
          await updatePlace(entity.id, { name: trimmed });
          break;
        case "containers":
          await updateContainer(entity.id, { name: trimmed });
          break;
        case "buildings":
          await updateBuilding(entity.id, { name: trimmed });
          break;
        case "furniture":
          await updateFurniture(entity.id, { name: trimmed });
          break;
        default:
          throw new Error(`Переименование не поддерживается для ${config.apiTable}`);
      }
      listPage.refreshList();
    },
    [config.apiTable, listPage.refreshList]
  );

  return (
    <ListPageContent
      listPage={listPage}
      getRowActions={getRowActions}
      onRename={handleRename}
    />
  );
}

export function EntityListPage({ config }: EntityListPageProps) {
  return (
    <Suspense fallback={null}>
      <EntityListPageContent config={config} />
    </Suspense>
  );
}
