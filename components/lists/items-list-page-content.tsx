"use client";

import { useState, useCallback } from "react";
import { PageHeader } from "../layout/page-header";
import { Button } from "../ui/button";
import { EntityList } from "./entity-list";
import { Plus, Barcode, Camera } from "lucide-react";
import { ListPagination } from "./list-pagination";
import { BarcodeScanner } from "@/components/common/scanner";
import { CameraCaptureDialog } from "@/components/common/camera-capture-dialog";
import AddItemForm from "@/components/forms/add-item-form";
import { toast } from "sonner";
import { barcodeLookupApi } from "@/lib/shared/api/barcode-lookup";
import { photoApi } from "@/lib/shared/api/photo";
import { recognizeItemPhotoApi } from "@/lib/shared/api/recognize-item-photo";
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
    <div className="flex flex-col gap-4">
      <PageHeader
        title={listPage.labels.plural}
        actions={
          addForm ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCameraDialogOpen(true)}
                disabled={isRecognizeLoading}
              >
                <Camera data-icon="inline-start" /> Сфотографировать
              </Button>
              <Button
                variant="outline"
                onClick={() => setBarcodeScannerOpen(true)}
                disabled={isBarcodeLookupLoading}
              >
                <Barcode data-icon="inline-start" /> Сканировать
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
  );
}
