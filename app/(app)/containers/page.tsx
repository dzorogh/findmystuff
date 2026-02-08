"use client";

import { Suspense } from "react";
import type { Item, Room, Place, Container } from "@/types/entity";
import type { EntityActionsCallbacks } from "@/lib/entities/components/entity-actions";
import AddContainerForm from "@/components/forms/add-container-form";
import MoveEntityForm from "@/components/forms/move-entity-form";
import { PageHeader } from "@/components/layout/page-header";
import { EntityList } from "@/components/lists/entity-list";
import { useListPage } from "@/lib/app/hooks/use-list-page";
import { CONTAINERS_LIST_CONFIG } from "@/lib/entities/containers/list-config";
import { useContainersListPageBehavior } from "@/lib/entities/containers/use-containers-list-page-behavior";
import { useContainersListRowActions } from "@/lib/entities/containers/use-containers-list-row-actions";

function ContainersPageContent() {
  const listConfig = { ...CONTAINERS_LIST_CONFIG, ...useContainersListPageBehavior() };
  const listPage = useListPage(listConfig);
  const setMovingId = "setMovingId" in listPage ? listPage.setMovingId : undefined;
  const getRowActions = useContainersListRowActions({
    refreshList: listPage.refreshList,
    setMovingId: setMovingId ?? (() => {}),
  });
  const containers = Array.isArray(listPage.data) ? listPage.data : [];
  const movingId = "movingId" in listPage ? listPage.movingId : null;
  const movingContainer = containers.find(
    (c: unknown) => (c as { id?: number }).id === movingId
  ) as { name?: string | null } | undefined;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Контейнеры" />
      <EntityList
        data={listPage.data}
        isLoading={listPage.isLoading}
        error={listPage.error}
        searchQuery={listPage.searchQuery}
        onSearchChange={listPage.handleSearchChange}
        sort={listPage.sort}
        onSortChange={listPage.setSort}
        filters={listPage.filters}
        onFiltersChange={listPage.setFilters}
        isFiltersOpen={listPage.isFiltersOpen}
        onFiltersOpenChange={listPage.setIsFiltersOpen}
        activeFiltersCount={listPage.activeFiltersCount}
        resultsCount={listPage.resultsCount}
        resultsLabel={listPage.resultsLabel}
        filterConfig={listPage.filterConfig}
        columnsConfig={listPage.columnsConfig}
        actionsConfig={listPage.actionsConfig}
        getRowActions={getRowActions as (entity: Item | Room | Place | Container) => EntityActionsCallbacks}
      />
      <AddContainerForm
        open={listPage.isAddDialogOpen ?? false}
        onOpenChange={listPage.handleAddDialogOpenChange ?? (() => {})}
        onSuccess={listPage.handleEntityAdded}
      />
      {movingId != null && (
        <MoveEntityForm
          title="Переместить контейнер"
          entityDisplayName={movingContainer?.name ?? `Контейнер #${movingId}`}
          destinationTypes={CONTAINERS_LIST_CONFIG.moveFormConfig.destinationTypes ?? ["room", "place", "container"]}
          buildPayload={(destinationType, destinationId) => ({
            container_id: movingId,
            destination_type: destinationType,
            destination_id: destinationId,
          })}
          getSuccessMessage={(name) => `Контейнер успешно перемещён в ${name}`}
          getErrorMessage={() => "Произошла ошибка при перемещении контейнера"}
          excludeContainerId={movingId}
          open={true}
          onOpenChange={(open) => !open && setMovingId?.(null)}
          onSuccess={() => {
            setMovingId?.(null);
            listPage.refreshList();
          }}
        />
      )}
    </div>
  );
}

const ContainersPage = () => (
  <Suspense fallback={null}>
    <ContainersPageContent />
  </Suspense>
);

export default ContainersPage;
