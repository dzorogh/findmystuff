"use client";

import { Suspense, useCallback, useMemo } from "react";
import { ListPageContent } from "@/components/lists/list-page-content";
import { useListPage } from "@/lib/app/hooks/use-list-page";
import { resolveActions } from "@/lib/entities/resolve-actions";
import type { EntityDisplay } from "@/lib/app/types/entity-config";
import { createEntityListHandlers } from "@/lib/entities/create-entity-handlers";
import { usePrintEntityLabel } from "@/lib/entities/hooks/use-print-entity-label";
import { roomsEntityConfig } from "@/lib/entities/rooms/entity-config";

function RoomsPageContent() {
  const listPage = useListPage(roomsEntityConfig);
  const printLabel = usePrintEntityLabel("room");
  const handlers = useMemo(
    () => createEntityListHandlers(roomsEntityConfig.apiTable, roomsEntityConfig.labels, listPage.refreshList),
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
    (entity: EntityDisplay) => resolveActions(roomsEntityConfig.actions, entity, ctx),
    [ctx]
  );

  return <ListPageContent listPage={listPage} getRowActions={getRowActions} />;
}

const RoomsPage = () => (
  <Suspense fallback={null}>
    <RoomsPageContent />
  </Suspense>
);

export default RoomsPage;
