"use client";

import { useState, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useCurrentPage } from "@/lib/app/contexts/current-page-context";
import { useUser } from "@/lib/users/context";
import { getPlace, updatePlace } from "@/lib/places/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { FormGroup } from "@/components/ui/form-group";
import { useEntityDataLoader } from "@/lib/entities/hooks/use-entity-data-loader";
import { useEntityTypes } from "@/lib/entities/hooks/use-entity-types";
import { EntityDetailSkeleton } from "@/components/entity-detail/entity-detail-skeleton";
import { EntityDetailError } from "@/components/entity-detail/entity-detail-error";
import { EntityActions } from "@/components/entity-detail/entity-actions";
import { TransitionsTable } from "@/components/entity-detail/transitions-table";
import { EntityContentGrid } from "@/components/entity-detail/entity-content-grid";
import MovePlaceForm from "@/components/forms/move-place-form";
import ImageUpload from "@/components/common/image-upload";
import { ErrorMessage } from "@/components/common/error-message";
import { useEntityActions } from "@/lib/entities/hooks/use-entity-actions";
import { usePrintEntityLabel } from "@/lib/entities/hooks/use-print-entity-label";
import type { Transition, PlaceEntity } from "@/types/entity";

type Place = PlaceEntity;

export default function PlaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const placeId = parseInt(params.id as string);
  const { user, isLoading: isUserLoading } = useUser();
  const { setEntityName, setIsLoading, setEntityActions } = useCurrentPage();
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

  const { types: placeTypes } = useEntityTypes("place");
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/");
    }
  }, [isUserLoading, user, router]);

  const loadPlaceData = useCallback(async () => {
    if (!user) return;

    setIsPageLoading(true);
    setIsLoading(true); // Устанавливаем загрузку в контекст для TopBar
    setError(null);

    try {
      const response = await getPlace(placeId);

      if (response.error || !response.data) {
        setError("Место не найдено");
        setIsPageLoading(false);
        setIsLoading(false);
        setEntityName(null);
        return;
      }

      const { place: placeData, transitions: transitionsWithNames, items, containers } = response.data;

      if (!placeData) {
        setError("Место не найдено");
        setIsPageLoading(false);
        setIsLoading(false);
        setEntityName(null);
        return;
      }

      // Устанавливаем имя в контекст сразу после получения данных места
      // чтобы оно отображалось в крошках как можно раньше
      const nameToSet = placeData.name || `Место #${placeData.id}`;
      flushSync(() => {
        setEntityName(nameToSet);
      });
      setIsLoading(false);

      setPlace(placeData);
      setTransitions(transitionsWithNames);
      setPlaceItems(items || []);
      setPlaceContainers(containers || []);
    } catch (err) {
      console.error("Ошибка загрузки данных места:", err);
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных");
      setIsLoading(false); // Загрузка завершена с ошибкой
      setEntityName(null);
    } finally {
      setIsPageLoading(false);
    }
  }, [user, placeId, setEntityName, setIsLoading]);

  useEntityDataLoader({
    user,
    isUserLoading,
    entityId: placeId,
    loadData: loadPlaceData,
  });

  const { isDeleting, isRestoring, handleDelete, handleRestore } = useEntityActions({
    entityType: "places",
    entityId: placeId,
    entityName: "Место",
    onSuccess: loadPlaceData,
  });

  const printLabel = usePrintEntityLabel("place");

  useEffect(() => {
    if (!place) {
      setEntityActions(null);
      return;
    }
    setEntityActions(
      <EntityActions
        isDeleted={!!place.deleted_at}
        isDeleting={isDeleting}
        isRestoring={isRestoring}
        showEdit={false}
        onEdit={() => { }}
        onMove={() => setIsMoveDialogOpen(true)}
        onPrintLabel={() => printLabel(place.id, place.name)}
        onDelete={handleDelete}
        onRestore={handleRestore}
      />
    );
    return () => setEntityActions(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers from hooks; re-run only when entity/loading state changes
  }, [place, isDeleting, isRestoring]);

  useEffect(() => {
    if (place) {
      setName(place.name ?? "");
      setPhotoUrl(place.photo_url ?? null);
    }
  }, [place]);

  if (isUserLoading || isLoading) {
    return <EntityDetailSkeleton />;
  }

  if (!user) {
    return null;
  }

  if (error || !place) {
    return <EntityDetailError error={error} entityName="Место" />;
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

  const selectedPlaceType = placeTypes.find((t) => t.id === place.entity_type_id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
            <FormGroup>
              <FormField label="Название места" htmlFor={`place-name-${place.id}`}>
                <Input
                  id={`place-name-${place.id}`}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например: Ш1П1, С1П2"
                  disabled={isSubmitting}
                />
              </FormField>

              {selectedPlaceType && (
                <FormField
                  label="Тип места"
                  description="Тип места нельзя изменить после создания"
                >
                  <div className="rounded-md border bg-muted px-3 py-2">
                    <p className="text-sm font-medium">{selectedPlaceType.name}</p>
                  </div>
                </FormField>
              )}

              <ImageUpload
                value={photoUrl}
                onChange={setPhotoUrl}
                disabled={isSubmitting}
                label="Фотография места (необязательно)"
              />

              <ErrorMessage message={formError ?? ""} />

              <div className="flex justify-end pt-2">
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
            </FormGroup>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
      <Card>
          <CardHeader>
            <CardTitle>Содержимое места</CardTitle>
            <CardDescription>
              Вещи и контейнеры, которые находятся в этом месте
            </CardDescription>
          </CardHeader>
          <CardContent>
            {placeItems.length === 0 && placeContainers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Место пусто
              </p>
            ) : (
              <div className="space-y-4">
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
        <MovePlaceForm
          placeId={place.id}
          placeName={place.name}
          open={isMoveDialogOpen}
          onOpenChange={setIsMoveDialogOpen}
          onSuccess={() => {
            setIsMoveDialogOpen(false);
            loadPlaceData();
          }}
        />
      )}
    </div>
  );
}
