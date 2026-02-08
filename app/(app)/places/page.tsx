"use client";

import { Suspense } from "react";
import type { Item, Room, Place, Container } from "@/types/entity";
import type { EntityActionsCallbacks } from "@/lib/entities/components/entity-actions";
import AddPlaceForm from "@/components/forms/add-place-form";
import MoveEntityForm from "@/components/forms/move-entity-form";
import { PageHeader } from "@/components/layout/page-header";
import { EntityList } from "@/components/lists/entity-list";
import { useListPage } from "@/lib/app/hooks/use-list-page";
import { PLACES_LIST_CONFIG } from "@/lib/entities/places/list-config";
import { usePlacesListPageBehavior } from "@/lib/entities/places/use-places-list-page-behavior";
import { usePlacesListRowActions } from "@/lib/entities/places/use-places-list-row-actions";

function PlacesPageContent() {
  const listConfig = { ...PLACES_LIST_CONFIG, ...usePlacesListPageBehavior() };
  const listPage = useListPage(listConfig);
  const setMovingId = "setMovingId" in listPage ? listPage.setMovingId : undefined;
  const getRowActions = usePlacesListRowActions({
    refreshList: listPage.refreshList,
    setMovingId: setMovingId ?? (() => { }),
  });
  const places = Array.isArray(listPage.data) ? listPage.data : [];
  const movingId = "movingId" in listPage ? listPage.movingId : null;
  const movingPlace = places.find(
    (p: unknown) => (p as { id?: number }).id === movingId
  ) as { name?: string | null } | undefined;

  return (
    <div className="flex flex-col gap-2">
      <PageHeader title="Места" />
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
        listIcon={listPage.listIcon}
        getListDisplayName={listPage.getListDisplayName}
        getRowActions={getRowActions as (entity: Item | Room | Place | Container) => EntityActionsCallbacks}
      />
      <AddPlaceForm
        open={listPage.isAddDialogOpen ?? false}
        onOpenChange={listPage.handleAddDialogOpenChange ?? (() => { })}
        onSuccess={listPage.handleEntityAdded}
      />
      {movingId != null && (
        <MoveEntityForm
          title="Переместить место"
          entityDisplayName={movingPlace?.name ?? `Место #${movingId}`}
          destinationTypes={PLACES_LIST_CONFIG.moveFormConfig.destinationTypes ?? ["room", "container"]}
          buildPayload={(destinationType, destinationId) => ({
            place_id: movingId,
            destination_type: destinationType,
            destination_id: destinationId,
          })}
          getSuccessMessage={(name) => `Место успешно перемещено в ${name}`}
          getErrorMessage={() => "Произошла ошибка при перемещении места"}
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

const PlacesPage = () => (
  <Suspense fallback={null}>
    <PlacesPageContent />
  </Suspense>
);

export default PlacesPage;
