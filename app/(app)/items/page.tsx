"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EntityList } from "@/components/lists/entity-list";
import { Plus, Barcode, Camera, Loader2, ScanSearch, X } from "lucide-react";
import { ListPagination } from "@/components/lists/list-pagination";
import { useListPage } from "@/lib/app/hooks/use-list-page";
import { useAddItem } from "@/lib/app/contexts/add-item-context";
import { resolveActions } from "@/lib/entities/resolve-actions";
import type { ActionsContext, EntityDisplay } from "@/types/entity";
import { useItemListActions } from "@/lib/entities/hooks/use-item-list-actions";
import { itemsEntityConfig } from "@/lib/entities/items/entity-config";
import { updateItem } from "@/lib/entities/api";
import { CameraCaptureDialog } from "@/components/common/camera-capture-dialog";
import { itemPhotoSearchApiClient } from "@/lib/shared/api/item-photo-search";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface PhotoSearchState {
  file: File;
  previewUrl: string;
  items: EntityDisplay[];
  totalCount: number;
  noSimilarFound: boolean;
  error: string | null;
}

export default function ItemsPage() {
  const listPage = useListPage(itemsEntityConfig);
  const addItem = useAddItem();
  const [isPhotoSearchOpen, setIsPhotoSearchOpen] = useState(false);
  const [isPhotoSearchLoading, setIsPhotoSearchLoading] = useState(false);
  const [photoSearch, setPhotoSearch] = useState<PhotoSearchState | null>(null);

  const photoSearchFiltersKey = JSON.stringify(listPage.filters);
  const photoSearchFilters = useMemo(
    () => listPage.filters as typeof itemsEntityConfig.filters.initial,
    [photoSearchFiltersKey]
  );

  const clearPhotoSearch = useCallback(() => {
    setPhotoSearch((prev) => {
      if (prev?.previewUrl) {
        URL.revokeObjectURL(prev.previewUrl);
      }
      return null;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (photoSearch?.previewUrl) {
        URL.revokeObjectURL(photoSearch.previewUrl);
      }
    };
  }, [photoSearch?.previewUrl]);

  const runPhotoSearch = useCallback(
    async (file: File, previewUrl?: string) => {
      const resolvedPreviewUrl = previewUrl ?? URL.createObjectURL(file);
      setIsPhotoSearchLoading(true);

      try {
        const result = await itemPhotoSearchApiClient.search({
          file,
          showDeleted: photoSearchFilters.showDeleted,
          entityTypeId: photoSearchFilters.entityTypeId,
          locationType: photoSearchFilters.locationType,
          roomId: photoSearchFilters.roomId,
          placeId: photoSearchFilters.placeId,
          containerId: photoSearchFilters.containerId,
          furnitureId: photoSearchFilters.furnitureId,
          hasPhoto: photoSearchFilters.hasPhoto,
        });

        setPhotoSearch((prev) => {
          if (prev?.previewUrl && prev.previewUrl !== resolvedPreviewUrl) {
            URL.revokeObjectURL(prev.previewUrl);
          }

          return {
            file,
            previewUrl: resolvedPreviewUrl,
            items: result.data,
            totalCount: result.totalCount,
            noSimilarFound: result.noSimilarFound,
            error: null,
          };
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Не удалось выполнить поиск по фото";
        toast.error(message);
        setPhotoSearch((prev) => {
          if (prev?.previewUrl && prev.previewUrl !== resolvedPreviewUrl) {
            URL.revokeObjectURL(prev.previewUrl);
          }

          return {
            file,
            previewUrl: resolvedPreviewUrl,
            items: [],
            totalCount: 0,
            noSimilarFound: false,
            error: message,
          };
        });
      } finally {
        setIsPhotoSearchLoading(false);
      }
    },
    [photoSearchFilters]
  );

  const refreshVisibleResults = useCallback(() => {
    listPage.refreshList();
    if (photoSearch) {
      void runPhotoSearch(photoSearch.file, photoSearch.previewUrl);
    }
  }, [listPage, photoSearch, runPhotoSearch]);

  const itemListActions = useItemListActions({ refreshList: refreshVisibleResults });

  useEffect(() => {
    addItem.setOnSuccess(refreshVisibleResults);
    return () => addItem.setOnSuccess(null);
  }, [addItem, refreshVisibleResults]);

  useEffect(() => {
    if (!photoSearch) return;
    void runPhotoSearch(photoSearch.file, photoSearch.previewUrl);
  }, [photoSearchFiltersKey, photoSearch?.file, photoSearch?.previewUrl, runPhotoSearch]);

  const ctx: ActionsContext = useMemo(
    () => ({
      refreshList: refreshVisibleResults,
      printLabel: (id: number, name?: string | null) => itemListActions.handlePrintLabel(id, name ?? null),
      handleDelete: itemListActions.handleDeleteItem,
      handleDuplicate: itemListActions.handleDuplicateItem,
      handleRestore: itemListActions.handleRestoreItem,
    }),
    [refreshVisibleResults, itemListActions]
  );
  const getRowActions = useCallback(
    (entity: EntityDisplay) => resolveActions(itemsEntityConfig.actions, entity, ctx),
    [ctx]
  );

  const handleRename = useCallback(
    async (entity: EntityDisplay, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed) return;
      await updateItem(entity.id, { name: trimmed });
      refreshVisibleResults();
    },
    [refreshVisibleResults]
  );

  const handleEditItemType = useCallback(
    async (entity: EntityDisplay, newItemTypeId: number | null) => {
      await updateItem(entity.id, { item_type_id: newItemTypeId });
      refreshVisibleResults();
    },
    [refreshVisibleResults]
  );

  const handlePhotoSearchCapture = useCallback(
    async (blob: Blob) => {
      const file =
        blob instanceof File
          ? blob
          : new File([blob], "photo-search.jpg", {
              type: blob.type || "image/jpeg",
            });
      await runPhotoSearch(file);
    },
    [runPhotoSearch]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (photoSearch) {
        clearPhotoSearch();
      }
      listPage.handleSearchChange(e);
    },
    [clearPhotoSearch, listPage, photoSearch]
  );

  const handleSortChange = useCallback(
    (sort: typeof listPage.sort) => {
      if (photoSearch) {
        clearPhotoSearch();
      }
      listPage.setSort(sort);
    },
    [clearPhotoSearch, listPage, photoSearch]
  );

  const addForm = listPage.addForm;
  const displayedData = photoSearch ? photoSearch.items : listPage.data;
  const displayedError = photoSearch?.error ?? listPage.error;
  const displayedResultsCount = photoSearch ? photoSearch.items.length : listPage.resultsCount;
  const isPhotoSearchActive = photoSearch != null;

  const photoSearchBanner = photoSearch ? (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative h-16 w-16 overflow-hidden rounded-md border bg-muted">
          <Image
            src={photoSearch.previewUrl}
            alt="Запрос для поиска по фото"
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
        <div className="min-w-0">
          <p className="font-medium">
            {isPhotoSearchLoading
              ? "Ищем похожие вещи..."
              : photoSearch.noSimilarFound
                ? "Похожих вещей не найдено"
                : `Найдено ${photoSearch.totalCount} похожих вещей`}
          </p>
          <p className="text-sm text-muted-foreground">
            Поиск учитывает и фотографии вещей, и их названия с категорией.
          </p>
          {photoSearch.error && (
            <p className="text-sm text-destructive">{photoSearch.error}</p>
          )}
        </div>
      </div>
      <Button type="button" variant="outline" onClick={clearPhotoSearch}>
        <X data-icon="inline-start" />
        Сбросить поиск по фото
      </Button>
    </Card>
  ) : null;

  const photoSearchToolbarAction = (
    <Button
      type="button"
      variant={isPhotoSearchActive ? "default" : "outline"}
      onClick={() => setIsPhotoSearchOpen(true)}
      disabled={isPhotoSearchLoading}
    >
      {isPhotoSearchLoading ? (
        <Loader2 className="animate-spin" data-icon="inline-start" />
      ) : (
        <ScanSearch data-icon="inline-start" />
      )}
      <span className="hidden sm:inline">Поиск по фото</span>
    </Button>
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
          data={displayedData}
          isLoading={isPhotoSearchLoading || (!isPhotoSearchActive && listPage.isLoading)}
          error={displayedError}
          searchQuery={listPage.searchQuery}
          onSearchChange={handleSearchChange}
          sort={listPage.sort}
          onSortChange={handleSortChange}
          filters={listPage.filters}
          onFiltersChange={listPage.setFilters}
          onResetFilters={listPage.resetFilters}
          isFiltersOpen={listPage.isFiltersOpen}
          onFiltersOpenChange={listPage.setIsFiltersOpen}
          activeFiltersCount={listPage.activeFiltersCount}
          resultsCount={displayedResultsCount}
          results={listPage.results}
          filterFields={listPage.filterFields}
          columns={listPage.columns}
          icon={listPage.icon}
          kind={listPage.kind}
          getName={listPage.getName}
          getRowActions={getRowActions}
          counts={listPage.counts}
          toolbarActions={photoSearchToolbarAction}
          toolbarContent={photoSearchBanner}
          onRename={handleRename}
          onEditItemType={handleEditItemType}
        />
        {!isPhotoSearchActive &&
          listPage.pagination &&
          listPage.pagination.totalCount > listPage.pagination.pageSize && (
            <ListPagination
              currentPage={listPage.pagination.currentPage}
              totalPages={listPage.pagination.totalPages}
              onPageChange={listPage.pagination.goToPage}
            />
          )}
        <CameraCaptureDialog
          open={isPhotoSearchOpen}
          onClose={() => setIsPhotoSearchOpen(false)}
          onCapture={handlePhotoSearchCapture}
        />
      </div>
    </Suspense>
  );
}
