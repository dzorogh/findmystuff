"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getBuilding, updateBuilding } from "@/lib/buildings/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useEntityDataLoader } from "@/lib/entities/hooks/use-entity-data-loader";
import { useEntityActions } from "@/lib/entities/hooks/use-entity-actions";
import { usePrintEntityLabel } from "@/lib/entities/hooks/use-print-entity-label";
import { EntityDetailSkeleton } from "@/components/entity-detail/entity-detail-skeleton";
import { EntityDetailError } from "@/components/entity-detail/entity-detail-error";
import { EntityActions } from "@/components/entity-detail/entity-actions";
import { EntityContentGrid } from "@/components/entity-detail/entity-content-grid";
import { EntityRelatedLinks } from "@/components/entity-detail/entity-related-links";
import ImageUpload from "@/components/fields/image-upload";
import { GenerateImageButton } from "@/components/fields/generate-image-button";
import { ErrorMessage } from "@/components/common/error-message";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTypeSelect } from "@/components/fields/entity-type-select";
import type { Building } from "@/types/entity";

export default function BuildingDetailPage() {
  const params = useParams();
  const buildingId = parseInt(params.id as string, 10);
  const isInvalidId = Number.isNaN(buildingId);

  const [building, setBuilding] = useState<Building | null>(null);
  const [buildingRooms, setBuildingRooms] = useState<Array<{
    id: number;
    name: string | null;
    photo_url: string | null;
    created_at: string;
  }>>([]);
  const [isLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [buildingTypeId, setBuildingTypeId] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadBuildingData = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (!silent) setIsPageLoading(true);
      setError(null);

      try {
        const response = await getBuilding(buildingId);

        if (response.error || !response.data) {
          setError("Здание не найдено");
          if (!silent) setIsPageLoading(false);
          return;
        }

        const { building: buildingData, rooms } = response.data;

        if (!buildingData) {
          setError("Здание не найдено");
          if (!silent) setIsPageLoading(false);
          return;
        }

        setBuilding({
          id: buildingData.id,
          name: buildingData.name,
          photo_url: buildingData.photo_url,
          created_at: buildingData.created_at,
          deleted_at: buildingData.deleted_at,
          building_type_id: buildingData.building_type_id ?? null,
          building_type: buildingData.building_type ?? null,
        });

        setBuildingRooms(
          (rooms || []).map((r) => ({
            id: r.id,
            name: r.name,
            photo_url: null,
            created_at: "",
          }))
        );
      } catch (err) {
        console.error("Ошибка загрузки данных здания:", err);
        setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных");
      } finally {
        if (!silent) setIsPageLoading(false);
      }
    },
    [buildingId]
  );

  useEntityDataLoader({
    entityId: buildingId,
    loadData: loadBuildingData,
  });

  const { isDeleting, isRestoring, handleDelete, handleRestore } = useEntityActions({
    entityType: "buildings",
    entityId: buildingId,
    entityName: "Здание",
    onSuccess: loadBuildingData,
  });

  const printLabel = usePrintEntityLabel("building");

  useEffect(() => {
    if (building) {
      setName(building.name ?? "");
      setBuildingTypeId(building.building_type_id?.toString() ?? "");
      setPhotoUrl(building.photo_url ?? null);
    }
  }, [building]);

  if (isInvalidId) {
    return <EntityDetailError error="Некорректный ID здания" entityName="Здание" />;
  }

  if (error && !isLoading) {
    return <EntityDetailError error={error} entityName="Здание" />;
  }

  if (!isLoading && !building) {
    return null;
  }

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!building) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      const response = await updateBuilding(building.id, {
        name: name.trim() || undefined,
        building_type_id: buildingTypeId ? parseInt(buildingTypeId) : null,
        photo_url: (photoUrl ?? "") || null,
      });
      if (response.error) throw new Error(response.error);
      toast.success("Здание успешно обновлено");
      await loadBuildingData({ silent: true });
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Произошла ошибка при сохранении"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const headerActions =
    building != null ? (
      <EntityActions
        actions={{
          actions: ["printLabel", "delete"],
          showRestoreWhenDeleted: true,
        }}
        callbacks={{
          onPrintLabel: () => printLabel(building.id, building.name),
          onDelete: handleDelete,
          onRestore: handleRestore,
        }}
        isDeleted={!!building.deleted_at}
        disabled={isDeleting || isRestoring}
        buttonVariant="default"
      />
    ) : null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        isLoading={isLoading}
        title={building?.name ?? (building ? `Здание #${building.id}` : "Здание")}
        ancestors={[
          { label: "Здания", href: "/buildings" },
        ]}
        actions={headerActions}
      />
      {building && (
        <EntityRelatedLinks
          links={[{ href: `/rooms?buildingId=${building.id}`, label: "Помещения" }]}
        />
      )}
      {isLoading ? (
        <EntityDetailSkeleton />
      ) : building ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Редактирование здания</CardTitle>
              <CardDescription className="flex items-center gap-2 flex-wrap">
                ID: #{building.id}
                {building.deleted_at && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <Badge variant="destructive">Удалено</Badge>
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEditSubmit}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor={`building-name-${building.id}`}>Название здания</FieldLabel>
                    <Input
                      id={`building-name-${building.id}`}
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Введите название здания"
                      disabled={isSubmitting}
                    />
                  </Field>

                  <EntityTypeSelect
                    type="building"
                    value={buildingTypeId ? parseInt(buildingTypeId) : null}
                    onValueChange={(v) => setBuildingTypeId(v ?? "")}
                  />

                  <ImageUpload
                    value={photoUrl}
                    onChange={setPhotoUrl}
                    disabled={isSubmitting}
                    label="Фотография здания (необязательно)"
                  />
                  <GenerateImageButton
                    entityName={name}
                    entityType="building"
                    onSuccess={async (url) => {
                      if (!building) return;
                      const res = await updateBuilding(building.id, { photo_url: url });
                      if (res.error) return;
                      toast.success("Изображение сгенерировано и сохранено");
                      await loadBuildingData({ silent: true });
                    }}
                    disabled={isSubmitting}
                  />

                  <ErrorMessage message={formError ?? ""} />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Сохранение...
                        </>
                      ) : (
                        "Сохранить"
                      )}
                    </Button>
                  </div>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Помещения в здании</CardTitle>
                <CardDescription>
                  Помещения, которые находятся в этом здании
                </CardDescription>
              </CardHeader>
              <CardContent>
                {buildingRooms.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    В здании пока нет помещений
                  </p>
                ) : (
                  <EntityContentGrid
                    items={buildingRooms}
                    emptyMessage=""
                    entityType="rooms"
                    title="Помещения"
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
