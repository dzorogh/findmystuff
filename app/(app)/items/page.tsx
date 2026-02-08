"use client";

import { Suspense } from "react";
import { ListPagination } from "@/components/lists/list-pagination";
import AddItemForm from "@/components/forms/add-item-form";
import { PageHeader } from "@/components/layout/page-header";
import { EntityList } from "@/components/lists/entity-list";
import { useListPage } from "@/lib/app/hooks/use-list-page";
import { ITEMS_LIST_CONFIG } from "@/lib/entities/items/list-config";
import { useItemsListPageBehavior } from "@/lib/entities/items/use-items-list-page-behavior";
import { useItemsListRowActions } from "@/lib/entities/items/use-items-list-row-actions";

function ItemsPageContent() {
  const listConfig = { ...ITEMS_LIST_CONFIG, ...useItemsListPageBehavior() };
  const listPage = useListPage(listConfig);
  const getRowActions = useItemsListRowActions({ refreshList: listPage.refreshList });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Вещи" />
      <EntityList
        entityType="items"
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
        getRowActions={getRowActions}
      />
      {"totalCount" in listPage &&
        listPage.totalCount != null &&
        "itemsPerPage" in listPage &&
        listPage.itemsPerPage != null &&
        listPage.totalCount > listPage.itemsPerPage && (
          <ListPagination
            currentPage={listPage.currentPage!}
            totalPages={listPage.totalPages!}
            onPageChange={listPage.goToPage!}
          />
        )}
      <AddItemForm
        open={listPage.isAddDialogOpen ?? false}
        onOpenChange={listPage.handleAddDialogOpenChange ?? (() => {})}
        onSuccess={listPage.handleEntityAdded}
      />
    </div>
  );
}

const ItemsPage = () => (
  <Suspense fallback={null}>
    <ItemsPageContent />
  </Suspense>
);

export default ItemsPage;
