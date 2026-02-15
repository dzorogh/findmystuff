"use client";

import { useState, useCallback } from "react";
import { PageHeader } from "../layout/page-header";
import { Button } from "../ui/button";
import { EntityList } from "./entity-list";
import { Plus, Barcode } from "lucide-react";
import { ListPagination } from "./list-pagination";
import BarcodeScanner from "@/components/common/barcode-scanner";
import AddItemForm from "@/components/forms/add-item-form";
import { toast } from "sonner";
import { barcodeLookupApi } from "@/lib/shared/api/barcode-lookup";
import type { EntityActionsCallbacks } from "@/components/entity-detail/entity-actions";
import type { EntityDisplay } from "@/lib/app/types/entity-config";

export function ItemsListPageContent({
  listPage,
  getRowActions,
}: {
  listPage: ReturnType<typeof import("@/lib/app/hooks/use-list-page").useListPage>;
  getRowActions: (entity: EntityDisplay) => EntityActionsCallbacks;
}) {
  const addForm = listPage.addForm;
  const [barcodeScannerOpen, setBarcodeScannerOpen] = useState(false);
  const [addFormInitialName, setAddFormInitialName] = useState<string | null>(null);
  const [isBarcodeLookupLoading, setIsBarcodeLookupLoading] = useState(false);

  const handleBarcodeScanSuccess = useCallback(
    async (barcode: string) => {
      setBarcodeScannerOpen(false);
      setIsBarcodeLookupLoading(true);

      try {
        const data = await barcodeLookupApi(barcode);

        if (data.error) {
          toast.error(data.error);
        }

        const productName = data.productName?.trim() || null;
        setAddFormInitialName(productName);
        listPage.handleAddFormOpenChange?.(true);

        if (!productName) {
          toast.info("Наименование не найдено. Введите название вручную.");
        }
      } catch (err) {
        console.error("Barcode lookup error:", err);
        toast.error("Не удалось получить данные по штрихкоду");
        setAddFormInitialName(null);
        listPage.handleAddFormOpenChange?.(true);
      } finally {
        setIsBarcodeLookupLoading(false);
      }
    },
    [listPage]
  );

  const handleAddFormOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setAddFormInitialName(null);
      }
      listPage.handleAddFormOpenChange?.(open);
    },
    [listPage]
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={listPage.labels.plural}
        actions={
          addForm ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setBarcodeScannerOpen(true)}
                disabled={isBarcodeLookupLoading}
              >
                <Barcode data-icon="inline-start" /> Добавить по штрихкоду
              </Button>
              <Button
                variant="default"
                onClick={() => listPage.handleAddFormOpenChange?.(true)}
              >
                <Plus data-icon="inline-start" /> {addForm.title}
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
        actions={listPage.actions}
        icon={listPage.icon}
        getName={listPage.getName}
        getRowActions={getRowActions}
      />
      {listPage.pagination &&
        listPage.pagination.totalCount > listPage.pagination.pageSize && (
          <ListPagination
            currentPage={listPage.pagination.currentPage}
            totalPages={listPage.pagination.totalPages}
            onPageChange={listPage.pagination.goToPage}
          />
        )}

      <BarcodeScanner
        open={barcodeScannerOpen}
        onClose={() => setBarcodeScannerOpen(false)}
        onScanSuccess={handleBarcodeScanSuccess}
      />

      <AddItemForm
        open={listPage.isAddFormOpen ?? false}
        onOpenChange={handleAddFormOpenChange}
        onSuccess={listPage.handleEntityAdded}
        initialName={addFormInitialName}
      />
    </div>
  );
}
