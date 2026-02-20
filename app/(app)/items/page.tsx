"use client";

import { Suspense, useCallback, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EntityList } from "@/components/lists/entity-list";
import { Plus, Barcode, Camera } from "lucide-react";
import { ListPagination } from "@/components/lists/list-pagination";
import { useListPage } from "@/lib/app/hooks/use-list-page";
import { useAddItem } from "@/lib/app/contexts/add-item-context";
import { resolveActions } from "@/lib/entities/resolve-actions";
import type { ActionsContext } from "@/lib/app/types/entity-action";
import type { EntityDisplay } from "@/lib/app/types/entity-config";
import { useItemListActions } from "@/lib/entities/hooks/use-item-list-actions";
import { itemsEntityConfig } from "@/lib/entities/items/entity-config";

export default function ItemsPage() {
  const listPage = useListPage(itemsEntityConfig);
  const itemListActions = useItemListActions({ refreshList: listPage.refreshList });
  const addItem = useAddItem();

  useEffect(() => {
    addItem.setOnSuccess(listPage.refreshList);
    return () => addItem.setOnSuccess(null);
  }, [addItem.setOnSuccess, listPage.refreshList]);

  const ctx: ActionsContext = useMemo(
    () => ({
      refreshList: listPage.refreshList,
      printLabel: (id: number, name?: string | null) => itemListActions.handlePrintLabel(id, name ?? null),
      handleDelete: itemListActions.handleDeleteItem,
      handleDuplicate: itemListActions.handleDuplicateItem,
      handleRestore: itemListActions.handleRestoreItem,
    }),
    [listPage.refreshList, itemListActions]
  );
  const getRowActions = useCallback(
    (entity: EntityDisplay) => resolveActions(itemsEntityConfig.actions, entity, ctx),
    [ctx]
  );

  const addForm = listPage.addForm;

  return (
    <Suspense fallback={null}>
      <div className="flex flex-col gap-4">
        <PageHeader
          title={listPage.labels.plural}
          actions={
            addForm ? (
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={addItem.openByPhoto}
                  disabled={addItem.isRecognizeLoading}
                >
                  <Camera data-icon="inline-start" />
                  <span className="hidden sm:inline">Сфотографировать</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={addItem.openByBarcode}
                  disabled={addItem.isBarcodeLookupLoading}
                >
                  <Barcode data-icon="inline-start" />
                  <span className="hidden sm:inline">Сканировать</span>
                </Button>
                <Button
                  variant="default"
                  onClick={addItem.openByForm}
                >
                  <Plus data-icon="inline-start" />
                  <span className="hidden sm:inline">{addForm.title}</span>
                </Button>
              </div>
            ) : null
          }
        />
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
          onResetFilters={listPage.resetFilters}
          isFiltersOpen={listPage.isFiltersOpen}
          onFiltersOpenChange={listPage.setIsFiltersOpen}
          activeFiltersCount={listPage.activeFiltersCount}
          resultsCount={listPage.resultsCount}
          results={listPage.results}
          filterFields={listPage.filterFields}
          columns={listPage.columns}
          icon={listPage.icon}
          getName={listPage.getName}
          getRowActions={getRowActions}
          counts={listPage.counts}
        />
        {listPage.pagination &&
          listPage.pagination.totalCount > listPage.pagination.pageSize && (
            <ListPagination
              currentPage={listPage.pagination.currentPage}
              totalPages={listPage.pagination.totalPages}
              onPageChange={listPage.pagination.goToPage}
            />
          )}
      </div>
    </Suspense>
  );
}
