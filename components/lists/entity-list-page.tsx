"use client";

import { Suspense, useCallback, useMemo } from "react";
import { ListPageContent } from "@/components/lists/list-page-content";
import { useListPage } from "@/lib/app/hooks/use-list-page";
import { resolveActions } from "@/lib/entities/resolve-actions";
import type { EntityConfig, EntityDisplay } from "@/lib/app/types/entity-config";
import { createEntityListHandlers } from "@/lib/entities/create-entity-handlers";
import { usePrintEntityLabel } from "@/lib/entities/hooks/use-print-entity-label";

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

  return <ListPageContent listPage={listPage} getRowActions={getRowActions} />;
}

export function EntityListPage({ config }: EntityListPageProps) {
  return (
    <Suspense fallback={null}>
      <EntityListPageContent config={config} />
    </Suspense>
  );
}
