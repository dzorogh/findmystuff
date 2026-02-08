"use client";

import { Suspense } from "react";
import AddRoomForm from "@/components/forms/add-room-form";
import { PageHeader } from "@/components/layout/page-header";
import { EntityList } from "@/components/lists/entity-list";
import { useListPage } from "@/lib/app/hooks/use-list-page";
import { ROOMS_LIST_CONFIG } from "@/lib/entities/rooms/list-config";
import { useRoomsListPageBehavior } from "@/lib/entities/rooms/use-rooms-list-page-behavior";
import { useRoomsListRowActions } from "@/lib/entities/rooms/use-rooms-list-row-actions";

function RoomsPageContent() {
  const listConfig = { ...ROOMS_LIST_CONFIG, ...useRoomsListPageBehavior() };
  const listPage = useListPage(listConfig);
  const getRowActions = useRoomsListRowActions({ refreshList: listPage.refreshList });

  return (
    <div className="flex flex-col gap-2">
      <PageHeader title="Помещения" />
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
        getRowActions={getRowActions}
      />
      <AddRoomForm
        open={listPage.isAddDialogOpen ?? false}
        onOpenChange={listPage.handleAddDialogOpenChange ?? (() => { })}
        onSuccess={listPage.handleEntityAdded}
      />
    </div>
  );
}

const RoomsPage = () => (
  <Suspense fallback={null}>
    <RoomsPageContent />
  </Suspense>
);

export default RoomsPage;
