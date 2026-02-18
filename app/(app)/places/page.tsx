"use client";

import { Suspense, useCallback, useMemo } from "react";
import { ListPageContent } from "@/components/lists/list-page-content";
import { useListPage } from "@/lib/app/hooks/use-list-page";
import { resolveActions } from "@/lib/entities/resolve-actions";
import type { EntityDisplay } from "@/lib/app/types/entity-config";
import { createEntityListHandlers } from "@/lib/entities/create-entity-handlers";
import { usePrintEntityLabel } from "@/lib/entities/hooks/use-print-entity-label";
import { placesEntityConfig } from "@/lib/entities/places/entity-config";

function PlacesPageContent() {
  const listPage = useListPage(placesEntityConfig);
  const printLabel = usePrintEntityLabel("place");
  const handlers = useMemo(
    () => createEntityListHandlers(placesEntityConfig.apiTable, placesEntityConfig.labels, listPage.refreshList),
    [listPage.refreshList]
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
    (entity: EntityDisplay) => resolveActions(placesEntityConfig.actions, entity, ctx),
    [ctx]
  );

  return <ListPageContent listPage={listPage} getRowActions={getRowActions} />;
}

const PlacesPage = () => (
  <Suspense fallback={null}>
    <PlacesPageContent />
  </Suspense>
);

export default PlacesPage;
