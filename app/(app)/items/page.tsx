"use client";

import { Suspense, useState, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EntityList } from "@/components/lists/entity-list";
import { Plus, Barcode, Camera } from "lucide-react";
import { ListPagination } from "@/components/lists/list-pagination";
import { BarcodeScanner } from "@/components/common/scanner";
import { CameraCaptureDialog } from "@/components/common/camera-capture-dialog";
import AddItemForm from "@/components/forms/add-item-form";
import { toast } from "sonner";
import { barcodeLookupApi } from "@/lib/shared/api/barcode-lookup";
import { photoApi } from "@/lib/shared/api/photo";
import { recognizeItemPhotoApi } from "@/lib/shared/api/recognize-item-photo";
import { useListPage } from "@/lib/app/hooks/use-list-page";
import { resolveActions } from "@/lib/entities/resolve-actions";
import type { ActionsContext } from "@/lib/app/types/entity-action";
import type { EntityDisplay } from "@/lib/app/types/entity-config";
import { useItemListActions } from "@/lib/entities/hooks/use-item-list-actions";
import { itemsEntityConfig } from "@/lib/entities/items/entity-config";

export default function ItemsPage() {
  const listPage = useListPage(itemsEntityConfig);
  const itemListActions = useItemListActions({ refreshList: listPage.refreshList });
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
  const [barcodeScannerOpen, setBarcodeScannerOpen] = useState(false);
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const [addFormInitialName, setAddFormInitialName] = useState<string | null>(null);
  const [addFormInitialPhotoUrl, setAddFormInitialPhotoUrl] = useState<string | null>(null);
  const [isBarcodeLookupLoading, setIsBarcodeLookupLoading] = useState(false);
  const [isRecognizeLoading, setIsRecognizeLoading] = useState(false);

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

  const handleCameraCapture = useCallback(
    async (blob: Blob) => {
      setCameraDialogOpen(false);
      setIsRecognizeLoading(true);
      const toastId = toast.loading("Распознавание предмета...");

      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });

      try {
        const [uploadResult, recognizeResult] = await Promise.all([
          photoApi.uploadPhoto(file),
          recognizeItemPhotoApi(file),
        ]);

        const url = uploadResult.data?.url ?? null;
        const itemName = recognizeResult.itemName?.trim() ?? null;

        setAddFormInitialPhotoUrl(url);
        setAddFormInitialName(itemName);
        listPage.handleAddFormOpenChange?.(true);

        if (recognizeResult.error) {
          toast.error(recognizeResult.error);
        }
        if (!itemName) {
          toast.info("Название не распознано. Введите название вручную.");
        }
      } catch (err) {
        console.error("Photo capture/recognize error:", err);
        toast.error(
          err instanceof Error ? err.message : "Не удалось обработать фотографию"
        );
        setAddFormInitialPhotoUrl(null);
        setAddFormInitialName(null);
        listPage.handleAddFormOpenChange?.(true);
      } finally {
        toast.dismiss(toastId);
        setIsRecognizeLoading(false);
      }
    },
    [listPage]
  );

  const handleAddFormOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setAddFormInitialName(null);
        setAddFormInitialPhotoUrl(null);
      }
      listPage.handleAddFormOpenChange?.(open);
    },
    [listPage]
  );

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
                  onClick={() => setCameraDialogOpen(true)}
                  disabled={isRecognizeLoading}
                >
                  <Camera data-icon="inline-start" />
                  <span className="hidden sm:inline">Сфотографировать</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setBarcodeScannerOpen(true)}
                  disabled={isBarcodeLookupLoading}
                >
                  <Barcode data-icon="inline-start" />
                  <span className="hidden sm:inline">Сканировать</span>
                </Button>
                <Button
                  variant="default"
                  onClick={() => listPage.handleAddFormOpenChange?.(true)}
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

        <CameraCaptureDialog
          open={cameraDialogOpen}
          onClose={() => setCameraDialogOpen(false)}
          onCapture={handleCameraCapture}
        />

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
          initialPhotoUrl={addFormInitialPhotoUrl}
        />
      </div>
    </Suspense>
  );
}
