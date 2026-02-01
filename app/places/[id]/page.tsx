"use client";

// React и Next.js
import { useState, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { useParams, useRouter } from "next/navigation";

// Контексты
import { useCurrentPage } from "@/lib/app/contexts/current-page-context";
import { useUser } from "@/lib/users/context";

import { getPlace } from "@/lib/places/api";

// UI компоненты
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Warehouse } from "lucide-react";

// Компоненты entity-detail
import { useEntityDataLoader } from "@/lib/entities/hooks/use-entity-data-loader";
import { EntityDetailSkeleton } from "@/components/entity-detail/entity-detail-skeleton";
import { EntityDetailError } from "@/components/entity-detail/entity-detail-error";
import { EntityActions } from "@/components/entity-detail/entity-actions";
import { EntityLocation } from "@/components/entity-detail/entity-location";
import { EntityPhoto } from "@/components/entity-detail/entity-photo";
import { EntityCreatedDate } from "@/components/entity-detail/entity-created-date";
import { TransitionsTable } from "@/components/entity-detail/transitions-table";
import { EntityContentGrid } from "@/components/entity-detail/entity-content-grid";

// Формы
import EditPlaceForm from "@/components/forms/edit-place-form";
import MovePlaceForm from "@/components/forms/move-place-form";

// Утилиты
import { useEntityActions } from "@/lib/entities/hooks/use-entity-actions";
import { usePrintEntityLabel } from "@/lib/entities/hooks/use-print-entity-label";

// Типы
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);

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
        onEdit={() => setIsEditDialogOpen(true)}
        onMove={() => setIsMoveDialogOpen(true)}
        onPrintLabel={() => printLabel(place.id, place.name)}
        onDelete={handleDelete}
        onRestore={handleRestore}
      />
    );
    return () => setEntityActions(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers from hooks; re-run only when entity/loading state changes
  }, [place, isDeleting, isRestoring]);

  if (isUserLoading || isLoading) {
    return <EntityDetailSkeleton />;
  }

  if (!user) {
    return null;
  }

  if (error || !place) {
    return <EntityDetailError error={error} entityName="Место" />;
  }

  const displayName = place.name ?? `Место #${place.id}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{displayName}</CardTitle>
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
        <CardContent className="space-y-4 pt-4">
          <EntityPhoto
            photoUrl={place.photo_url}
            name={displayName}
            defaultIcon={<Warehouse className="h-12 w-12 mx-auto text-muted-foreground" />}
            size="large"
            aspectRatio="video"
          />
          <EntityLocation
            location={place.last_location ?? null}
            variant="detailed"
          />
          <EntityCreatedDate createdAt={place.created_at} label="Создано" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>История перемещений</CardTitle>
          <CardDescription>
            Все перемещения этого места в хронологическом порядке
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransitionsTable
            transitions={transitions}
            emptyMessage="История перемещений пуста"
          />
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
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
              <div className="space-y-6">
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
      </div>

      {isEditDialogOpen && place && (
        <EditPlaceForm
          placeId={place.id}
          placeName={place.name}
          placeTypeId={place.entity_type_id}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={() => {
            setIsEditDialogOpen(false);
            loadPlaceData();
          }}
        />
      )}

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
