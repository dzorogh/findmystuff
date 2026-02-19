"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";

import { getFurnitureItem, updateFurniture } from "@/lib/furniture/api";
import { duplicateEntityApi } from "@/lib/shared/api/duplicate-entity";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { resolveActions } from "@/lib/entities/resolve-actions";
import { furnitureEntityConfig } from "@/lib/entities/furniture/entity-config";
import { EntityContentBlock } from "@/components/entity-detail/entity-content-block";
import AddPlaceForm from "@/components/forms/add-place-form";
import { EntityRelatedLinks } from "@/components/entity-detail/entity-related-links";
import { EntityImageCard } from "@/components/entity-detail/entity-image-card";
import { PageHeader } from "@/components/layout/page-header";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import RoomCombobox from "@/components/fields/room-combobox";
import { EntityTypeSelect } from "@/components/fields/entity-type-select";
import { PriceInput, type PriceValue } from "@/components/fields/price-input";
import { DatePicker } from "@/components/fields/date-picker";
import { ErrorMessage } from "@/components/common/error-message";
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
  const [addPlaceOpen, setAddPlaceOpen] = useState(false);

  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [furnitureTypeId, setFurnitureTypeId] = useState("");
  const [price, setPrice] = useState<PriceValue | null>(null);
  const [currentValue, setCurrentValue] = useState<PriceValue | null>(null);
  const [purchaseDate, setPurchaseDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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

  const { handleDelete, handleRestore } = useEntityActions({
    entityType: "furniture",
    entityId: furnitureId,
    entityName: "Мебель",
    onSuccess: loadFurnitureData,
  });

  const printLabel = usePrintEntityLabel("furniture");

  useEffect(() => {
    if (furniture) {
      setName(furniture.name ?? "");
      setRoomId(furniture.room_id?.toString() ?? "");
      setFurnitureTypeId(furniture.furniture_type_id?.toString() ?? "");
      setPrice(
        furniture.price?.amount != null && furniture.price?.currency
          ? { amount: furniture.price.amount, currency: furniture.price.currency }
          : null
      );
      setCurrentValue(
        furniture.currentValue?.amount != null && furniture.currentValue?.currency
          ? { amount: furniture.currentValue.amount, currency: furniture.currentValue.currency }
          : null
      );
      setPurchaseDate(furniture.purchaseDate ?? "");
    }
  }, [furniture]);

  const handleDuplicate = useCallback(async () => {
    const res = await duplicateEntityApi.duplicate("furniture", furnitureId);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Мебель успешно дублирована");
      loadFurnitureData({ silent: true });
    }
  }, [furnitureId, loadFurnitureData]);

  const furnitureCtx = useMemo(
    () => ({
      refreshList: () => loadFurnitureData({ silent: true }),
      printLabel: (id: number, name?: string | null) => printLabel(id, name ?? null),
      handleDelete,
      handleDuplicate,
      handleRestore,
    }),
    [loadFurnitureData, printLabel, handleDelete, handleDuplicate, handleRestore]
  );

  if (isInvalidId) {
    return <EntityDetailError error="Некорректный ID мебели" entityName="Мебель" />;
  }

  if (error && !isLoading) {
    return <EntityDetailError error={error} entityName="Мебель" />;
  }

  if (!isLoading && !furniture) {
    return null;
  }

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!furniture) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await updateFurniture(furniture.id, {
        name: name.trim() || undefined,
        room_id: roomId ? parseInt(roomId) : undefined,
        furniture_type_id: furnitureTypeId ? parseInt(furnitureTypeId) : null,
        price_amount: price?.amount ?? null,
        price_currency: price?.currency ?? null,
        current_value_amount: currentValue?.amount ?? null,
        current_value_currency: currentValue?.currency ?? null,
        purchase_date: purchaseDate.trim() || null,
      });
      if (res.error) throw new Error(res.error);
      toast.success("Мебель успешно обновлена");
      await loadFurnitureData({ silent: true });
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Произошла ошибка при сохранении"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const headerActions =
    furniture != null ? (
      <EntityActions actions={resolveActions(furnitureEntityConfig.actions, furniture, furnitureCtx)} />
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
      {furniture && (
        <EntityRelatedLinks
          links={[{ href: `/places?furnitureId=${furniture.id}`, label: "Места" }]}
        />
      )}
      {isLoading ? (
        <EntityDetailSkeleton />
      ) : furniture ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-6">
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
                <form id={`furniture-form-${furniture.id}`} onSubmit={handleEditSubmit}>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor={`furniture-name-${furniture.id}`}>Название мебели</FieldLabel>
                      <Input
                        id={`furniture-name-${furniture.id}`}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Введите название мебели"
                        disabled={isSubmitting}
                      />
                    </Field>

                    <RoomCombobox
                      selectedRoomId={roomId}
                      onRoomIdChange={setRoomId}
                      disabled={isSubmitting}
                      label="Помещение"
                      id={`furniture-room-${furniture.id}`}
                      required
                    />

                    <EntityTypeSelect
                      type="furniture"
                      value={furnitureTypeId ? parseInt(furnitureTypeId) : null}
                      onValueChange={(v) => setFurnitureTypeId(v ?? "")}
                    />

                    <PriceInput
                      value={price}
                      onChange={setPrice}
                      disabled={isSubmitting}
                      id={`furniture-price-${furniture.id}`}
                      label="Стоимость покупки (необязательно)"
                    />

                    <PriceInput
                      value={currentValue}
                      onChange={setCurrentValue}
                      id={`furniture-current-value-${furniture.id}`}
                      label="Текущая оценочная стоимость (необязательно)"
                      disabled={isSubmitting}
                    />

                    <DatePicker
                      value={purchaseDate}
                      onChange={setPurchaseDate}
                      id={`furniture-purchase-date-${furniture.id}`}
                      label="Дата покупки"
                      placeholder="Выберите дату"
                      disabled={isSubmitting}
                    />

                    <ErrorMessage message={formError ?? ""} />
                  </FieldGroup>
                </form>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="submit" form={`furniture-form-${furniture.id}`} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    "Сохранить"
                  )}
                </Button>
              </CardFooter>
            </Card>

            <EntityImageCard
              entityType="furniture"
              entityId={furniture.id}
              entityName={name}
              photoUrl={furniture.photo_url ?? null}
              onPhotoChange={async (url) => {
                const res = await updateFurniture(furniture.id, { photo_url: url });
                if (res.error) throw new Error(res.error);
                await loadFurnitureData({ silent: true });
              }}
            />
          </div>

          <div>
            <EntityContentBlock
              title="Места в мебели"
              description="Места размещения, которые находятся в этой мебели"
              items={furniturePlaces}
              entityType="places"
              emptyMessage="В мебели пока нет мест"
              addButton={{
                label: "Добавить место",
                onClick: () => setAddPlaceOpen(true),
              }}
            />
          </div>
        </div>
      ) : null}

      <AddPlaceForm
        open={addPlaceOpen}
        onOpenChange={setAddPlaceOpen}
        onSuccess={() => loadFurnitureData({ silent: true })}
        initialFurnitureId={furniture?.id ?? undefined}
      />
    </div>
  );
}
