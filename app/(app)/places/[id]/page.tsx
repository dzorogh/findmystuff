"use client";

import { useState, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useCurrentPage } from "@/lib/app/contexts/current-page-context";
import { getPlace, updatePlace } from "@/lib/places/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useEntityDataLoader } from "@/lib/entities/hooks/use-entity-data-loader";
import { useEntityTypes } from "@/lib/entities/hooks/use-entity-types";
import { EntityDetailSkeleton } from "@/components/entity-detail/entity-detail-skeleton";
import { EntityDetailError } from "@/components/entity-detail/entity-detail-error";
import { EntityActions } from "@/components/entity-detail/entity-actions";
import { TransitionsTable } from "@/components/entity-detail/transitions-table";
import { EntityContentGrid } from "@/components/entity-detail/entity-content-grid";
import MoveEntityForm from "@/components/forms/move-entity-form";
import { placesEntityConfig } from "@/lib/entities/places/entity-config";
import ImageUpload from "@/components/fields/image-upload";
import { ErrorMessage } from "@/components/common/error-message";
import { useEntityActions } from "@/lib/entities/hooks/use-entity-actions";
import { usePrintEntityLabel } from "@/lib/entities/hooks/use-print-entity-label";
import type { Transition, PlaceEntity } from "@/types/entity";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTypeSelect } from "@/components/fields/entity-type-select";

type Place = PlaceEntity;

export default function PlaceDetailPage() {
  const params = useParams();

  const placeId = parseInt(params.id as string);
  const [place, setPlace] = useState<Place | null>(null);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [placeItems, setPlaceItems] = useState<Array<{
    id: number;
    name: string | null;
    photo_url: string | null;
    created_at: string;
  }>>([]);
  const [placeContainers, setPlaceContainers] = useState<Array<{
    id: number;
    name: string | null;
    photo_url: string | null;
    created_at: string;
  }>>([]);
  const [isLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);

  const [name, setName] = useState("");
  const [placeTypeId, setPlaceTypeId] = useState<number | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadPlaceData = useCallback(async () => {

    setIsPageLoading(true);
    setError(null);

    try {
      const response = await getPlace(placeId);

      if (response.error || !response.data) {
        setError("Место не найдено");
        setIsPageLoading(false);
        return;
      }

      const { place: placeData, transitions: transitionsWithNames, items, containers } = response.data;

      if (!placeData) {
        setError("Место не найдено");
        setIsPageLoading(false);
        return;
      }

      setPlace(placeData);
      setTransitions(transitionsWithNames);
      setPlaceItems(items || []);
      setPlaceContainers(containers || []);
    } catch (err) {
      console.error("Ошибка загрузки данных места:", err);
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных");
    } finally {
      setIsPageLoading(false);
    }
  }, [placeId]);

  // TODO: Remove this once we have a proper data loader
  useEntityDataLoader({
    entityId: placeId,
    loadData: loadPlaceData,
  });

  useEffect(() => {
    if (place) {
      setName(place.name ?? "");
      setPlaceTypeId(place.entity_type_id ?? null);
      setPhotoUrl(place.photo_url ?? null);
    }
  }, [place]);

  if (error && !isLoading) {
    return <EntityDetailError error={error} entityName="Место" />;
  }

  if (!isLoading && !place) {
    return null;
  }

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!place) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      const response = await updatePlace(place.id, {
        name: name.trim() || undefined,
        photo_url: photoUrl || undefined,
      });
      if (response.error) throw new Error(response.error);
      toast.success("Место успешно обновлено");
      loadPlaceData();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Произошла ошибка при сохранении"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPageLoading = isLoading;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        isLoading={isPageLoading}
        title={place?.name ?? (place ? `Место #${place.id}` : "Место")}
        ancestors={[
          { label: "Места", href: "/places" },
        ]}
      />
      {isPageLoading ? (
        <EntityDetailSkeleton />
      ) : place ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Редактирование места</CardTitle>
              <CardDescription className="flex items-center gap-2 flex-wrap">
                ID: #{place.id}
                {place.deleted_at && (
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
                    <FieldLabel htmlFor={`place-name-${place.id}`}>Название места</FieldLabel>
                    <Input
                      id={`place-name-${place.id}`}
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Например: Ш1П1, С1П2"
                      disabled={isSubmitting}
                    />
                  </Field>

                  <EntityTypeSelect
                    type="place"
                    value={placeTypeId}
                    onValueChange={(v) => setPlaceTypeId(v ? parseInt(v) : null)}
                  />

                  <ImageUpload
                    value={photoUrl}
                    onChange={setPhotoUrl}
                    disabled={isSubmitting}
                    label="Фотография места (необязательно)"
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

          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Содержимое места</CardTitle>
                <CardDescription>
                  Вещи и контейнеры, которые находятся в этом месте
                </CardDescription>
              </CardHeader>
              <CardContent>
                {placeItems.length === 0 && placeContainers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Место пусто
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {placeItems.length > 0 && (
                      <EntityContentGrid
                        items={placeItems}
                        emptyMessage=""
                        entityType="items"
                        title="Вещи"
                      />
                    )}
                    {placeContainers.length > 0 && (
                      <EntityContentGrid
                        items={placeContainers}
                        emptyMessage=""
                        entityType="containers"
                        title="Контейнеры"
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>История перемещений</CardTitle>
              </CardHeader>
              <CardContent>
                <TransitionsTable
                  transitions={transitions}
                  emptyMessage="История перемещений пуста"
                />
              </CardContent>
            </Card>
          </div>

          {isMoveDialogOpen && place && (
            <MoveEntityForm
              title={placesEntityConfig.labels.moveTitle}
              entityDisplayName={place.name ?? `Место #${place.id}`}
              destinationTypes={placesEntityConfig.actions.move?.destinationTypes ?? ["room", "container"]}
              buildPayload={(destinationType, destinationId) => ({
                place_id: place.id,
                destination_type: destinationType,
                destination_id: destinationId,
              })}
              getSuccessMessage={placesEntityConfig.labels.moveSuccess}
              getErrorMessage={() => placesEntityConfig.labels.moveError}
              open={isMoveDialogOpen}
              onOpenChange={setIsMoveDialogOpen}
              onSuccess={() => {
                setIsMoveDialogOpen(false);
                loadPlaceData();
              }}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
