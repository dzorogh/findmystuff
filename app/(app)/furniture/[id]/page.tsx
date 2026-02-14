"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";

import { getFurnitureItem, updateFurniture } from "@/lib/furniture/api";
import { duplicateEntityApi } from "@/lib/shared/api/duplicate-entity";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEntityDataLoader } from "@/lib/entities/hooks/use-entity-data-loader";
import { useEntityActions } from "@/lib/entities/hooks/use-entity-actions";
import { usePrintEntityLabel } from "@/lib/entities/hooks/use-print-entity-label";
import { EntityDetailSkeleton } from "@/components/entity-detail/entity-detail-skeleton";
import { EntityDetailError } from "@/components/entity-detail/entity-detail-error";
import { EntityActions } from "@/components/entity-detail/entity-actions";
import { EntityContentGrid } from "@/components/entity-detail/entity-content-grid";
import { PageHeader } from "@/components/layout/page-header";
import { EditFurnitureForm } from "@/components/forms/edit-furniture-form";
import { GenerateImageButton } from "@/components/fields/generate-image-button";
import { toast } from "sonner";
import type { Furniture } from "@/types/entity";

export default function FurnitureDetailPage() {
  const params = useParams();
  const furnitureId = parseInt(params.id as string, 10);
  const isInvalidId = Number.isNaN(furnitureId);

  const [furniture, setFurniture] = useState<Furniture | null>(null);
  const [furniturePlaces, setFurniturePlaces] = useState<Array<{
    id: number;
    name: string | null;
    photo_url: string | null;
    created_at: string;
  }>>([]);
  const [isLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFurnitureData = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (!silent) setIsPageLoading(true);
      setError(null);

      try {
        const response = await getFurnitureItem(furnitureId);

        if (response.error || !response.data) {
          setError("Мебель не найдена");
          if (!silent) setIsPageLoading(false);
          return;
        }

        const { furniture: furnitureData, places } = response.data;

        if (!furnitureData) {
          setError("Мебель не найдена");
          if (!silent) setIsPageLoading(false);
          return;
        }

        setFurniture({
          id: furnitureData.id,
          name: furnitureData.name,
          photo_url: furnitureData.photo_url,
          created_at: furnitureData.created_at,
          deleted_at: furnitureData.deleted_at,
          room_id: furnitureData.room_id,
          room_name: furnitureData.room_name ?? null,
          furniture_type_id: furnitureData.furniture_type_id ?? null,
          furniture_type: furnitureData.furniture_type ?? null,
          places_count: furnitureData.places_count ?? 0,
          price: furnitureData.price ?? null,
          currentValue: furnitureData.currentValue ?? null,
          purchaseDate: furnitureData.purchaseDate ?? null,
        });

        setFurniturePlaces(
          (places || []).map((p) => ({
            id: p.id,
            name: p.name,
            photo_url: null,
            created_at: "",
          }))
        );
      } catch (err) {
        console.error("Ошибка загрузки данных мебели:", err);
        setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных");
      } finally {
        if (!silent) setIsPageLoading(false);
      }
    },
    [furnitureId]
  );

  useEntityDataLoader({
    entityId: furnitureId,
    loadData: loadFurnitureData,
  });

  const { isDeleting, isRestoring, handleDelete, handleRestore } = useEntityActions({
    entityType: "furniture",
    entityId: furnitureId,
    entityName: "Мебель",
    onSuccess: loadFurnitureData,
  });

  const printLabel = usePrintEntityLabel("furniture");

  if (isInvalidId) {
    return <EntityDetailError error="Некорректный ID мебели" entityName="Мебель" />;
  }

  if (error && !isLoading) {
    return <EntityDetailError error={error} entityName="Мебель" />;
  }

  if (!isLoading && !furniture) {
    return null;
  }

  const handleDuplicate = async () => {
    const res = await duplicateEntityApi.duplicate("furniture", furniture!.id);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Мебель успешно дублирована");
      loadFurnitureData({ silent: true });
    }
  };

  const headerActions =
    furniture != null ? (
      <EntityActions
        actions={{
          actions: ["printLabel", "duplicate", "delete"],
          showRestoreWhenDeleted: true,
        }}
        callbacks={{
          onPrintLabel: () => printLabel(furniture.id, furniture.name),
          onDuplicate: handleDuplicate,
          onDelete: handleDelete,
          onRestore: handleRestore,
        }}
        isDeleted={!!furniture.deleted_at}
        disabled={isDeleting || isRestoring}
        buttonVariant="default"
      />
    ) : null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        isLoading={isLoading}
        title={furniture?.name ?? (furniture ? `Мебель #${furniture.id}` : "Мебель")}
        ancestors={[
          { label: "Мебель", href: "/furniture" },
          ...(furniture?.room_id && furniture?.room_name
            ? [
              {
                label: furniture.room_name,
                href: `/rooms/${furniture.room_id}`,
              },
            ]
            : []),
        ]}
        actions={headerActions}
      />
      {isLoading ? (
        <EntityDetailSkeleton />
      ) : furniture ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Редактирование мебели</CardTitle>
              <CardDescription className="flex items-center gap-2 flex-wrap">
                ID: #{furniture.id}
                {furniture.deleted_at && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <Badge variant="destructive">Удалено</Badge>
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EditFurnitureForm furniture={furniture} onSuccess={() => loadFurnitureData({ silent: true })} />
              <div className="mt-4">
                <GenerateImageButton
                  entityName={furniture.name ?? ""}
                  entityType="furniture"
                  onSuccess={async (url) => {
                    if (!furniture) return;
                    const res = await updateFurniture(furniture.id, { photo_url: url });
                    if (res.error) return;
                    toast.success("Изображение сгенерировано и сохранено");
                    await loadFurnitureData({ silent: true });
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Места в мебели</CardTitle>
                <CardDescription>
                  Места размещения, которые находятся в этой мебели
                </CardDescription>
              </CardHeader>
              <CardContent>
                {furniturePlaces.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    В мебели пока нет мест
                  </p>
                ) : (
                  <EntityContentGrid
                    items={furniturePlaces}
                    emptyMessage=""
                    entityType="places"
                    title="Места"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
