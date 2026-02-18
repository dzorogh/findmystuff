"use client";

import { Suspense, useCallback, useMemo } from "react";
import { ListPageContent } from "@/components/lists/list-page-content";
import { useListPage } from "@/lib/app/hooks/use-list-page";
import { resolveActions } from "@/lib/entities/resolve-actions";
import type { EntityDisplay } from "@/lib/app/types/entity-config";
import { createEntityListHandlers } from "@/lib/entities/create-entity-handlers";
import { usePrintEntityLabel } from "@/lib/entities/hooks/use-print-entity-label";
import { containersEntityConfig } from "@/lib/entities/containers/entity-config";

function ContainersPageContent() {
  const listPage = useListPage(containersEntityConfig);
  const printLabel = usePrintEntityLabel("container");
  const handlers = useMemo(
    () => createEntityListHandlers(containersEntityConfig.apiTable, containersEntityConfig.labels, listPage.refreshList),
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
    (entity: EntityDisplay) => resolveActions(containersEntityConfig.actions, entity, ctx),
    [ctx]
  );

  return <ListPageContent listPage={listPage} getRowActions={getRowActions} />;
}

const ContainersPage = () => (
  <Suspense fallback={null}>
    <ContainersPageContent />
  </Suspense>
);

export default ContainersPage;
