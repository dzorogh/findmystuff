"use client";

// React и Next.js
import { useState, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { useParams, useRouter } from "next/navigation";

// Контексты
import { useCurrentPage } from "@/contexts/current-page-context";
import { useUser } from "@/hooks/use-user";

// API Client
import { apiClient } from "@/lib/api-client";

// UI компоненты
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "lucide-react";

// Общие компоненты

// Компоненты entity-detail
import { useEntityDataLoader } from "@/hooks/use-entity-data-loader";
import { EntityDetailSkeleton } from "@/components/entity-detail/entity-detail-skeleton";
import { EntityDetailError } from "@/components/entity-detail/entity-detail-error";
import { EntityHeader } from "@/components/entity-detail/entity-header";
import { EntityActions } from "@/components/entity-detail/entity-actions";
import { EntityLocation } from "@/components/entity-detail/entity-location";
import { TransitionsTable } from "@/components/entity-detail/transitions-table";
import { EntityContentGrid } from "@/components/entity-detail/entity-content-grid";
import { EntityCreatedDate } from "@/components/entity-detail/entity-created-date";

// Формы
import EditContainerForm from "@/components/forms/edit-container-form";
import MoveContainerForm from "@/components/forms/move-container-form";

// Утилиты
import { useEntityActions } from "@/hooks/use-entity-actions";
import { usePrintEntityLabel } from "@/hooks/use-print-entity-label";
import { getEntityDisplayName } from "@/lib/entity-display-name";

// Типы
import type { Transition, ContainerEntity } from "@/types/entity";

interface Container extends ContainerEntity {
  entity_type?: {
    name: string;
  } | null;
}

export default function ContainerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const containerId = parseInt(params.id as string);
  const { user, isLoading: isUserLoading } = useUser();
  const { setEntityName, setIsLoading, setEntityActions } = useCurrentPage();
  const [container, setContainer] = useState<Container | null>(null);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [containerItems, setContainerItems] = useState<Array<{
    id: number;
    name: string | null;
    photo_url: string | null;
    created_at: string;
  }>>([]);
  const [isLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/");
    }
  }, [isUserLoading, user, router]);

  const loadContainerData = useCallback(async () => {
    if (!user) return;

    setIsPageLoading(true);
    setIsLoading(true); // Устанавливаем загрузку в контекст для TopBar
    setError(null);

    try {
      const response = await apiClient.getContainer(containerId);

      if (response.error || !response.data) {
        setError("Контейнер не найден");
        setIsPageLoading(false);
        setIsLoading(false);
        setEntityName(null);
        return;
      }

      const { container: containerData, transitions: transitionsWithNames, items } = response.data;

      if (!containerData) {
        setError("Контейнер не найден");
        setIsPageLoading(false);
        setIsLoading(false);
        setEntityName(null);
        return;
      }

      // Устанавливаем имя в контекст сразу после получения данных контейнера
      // чтобы оно отображалось в крошках как можно раньше
      const nameToSet = getEntityDisplayName("container", containerData.id, containerData.name);
      flushSync(() => {
        setEntityName(nameToSet);
      });
      setIsLoading(false);

      setContainer(containerData);
      setTransitions(transitionsWithNames);
      setContainerItems(items || []);
    } catch (err) {
      console.error("Ошибка загрузки данных контейнера:", err);
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных");
      setIsLoading(false); // Загрузка завершена с ошибкой
      setEntityName(null);
    } finally {
      setIsPageLoading(false);
    }
  }, [user, containerId, setEntityName, setIsLoading]);

  useEntityDataLoader({
    user,
    isUserLoading,
    entityId: containerId,
    loadData: loadContainerData,
  });

  const { isDeleting, isRestoring, handleDelete, handleRestore } = useEntityActions({
    entityType: "containers",
    entityId: containerId,
    entityName: "Контейнер",
    onSuccess: loadContainerData,
  });

  const printLabel = usePrintEntityLabel("container");

  const handleEditSuccess = () => {
    setIsEditing(false);
    loadContainerData();
  };

  useEffect(() => {
    if (!container) {
      setEntityActions(null);
      return;
    }
    setEntityActions(
      <EntityActions
        isDeleted={!!container.deleted_at}
        isDeleting={isDeleting}
        isRestoring={isRestoring}
        onEdit={() => setIsEditing(true)}
        onMove={() => setIsMoving(true)}
        onPrintLabel={() => printLabel(container.id, container.name)}
        onDelete={handleDelete}
        onRestore={handleRestore}
      />
    );
    return () => setEntityActions(null);
  }, [container, isDeleting, isRestoring]);

  if (isUserLoading || isLoading) {
    return <EntityDetailSkeleton />;
  }

  if (!user) {
    return null;
  }

  if (error || !container) {
    return <EntityDetailError error={error} entityName="Контейнер" />;
  }

  return (
    <div className="container pb-10 pt-4 px-4 md:py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <EntityHeader
            id={container.id}
            name={getEntityDisplayName("container", container.id, container.name)}
            photoUrl={container.photo_url}
            isDeleted={!!container.deleted_at}
            defaultIcon={<Container className="h-12 w-12 text-muted-foreground" />}
            defaultName="Контейнер"
          />
          <CardContent className="space-y-4">
            <EntityLocation location={container.last_location || null} />
            <EntityCreatedDate createdAt={container.created_at} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>История перемещений</CardTitle>
            <CardDescription>
              Все перемещения этого контейнера в хронологическом порядке
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TransitionsTable
              transitions={transitions}
              emptyMessage="История перемещений пуста"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Содержимое контейнера</CardTitle>
            <CardDescription>
              Вещи, которые находятся в этом контейнере
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EntityContentGrid
              items={containerItems}
              emptyMessage="Контейнер пуст"
              entityType="items"
            />
          </CardContent>
        </Card>

        {isEditing && container && (
          <EditContainerForm
            containerId={container.id}
            containerName={container.name}
            containerTypeId={container.entity_type_id}
            open={isEditing}
            onOpenChange={setIsEditing}
            onSuccess={handleEditSuccess}
          />
        )}

        {isMoving && container && (
          <MoveContainerForm
            containerId={container.id}
            containerName={container.name}
            open={isMoving}
            onOpenChange={setIsMoving}
            onSuccess={() => {
              setIsMoving(false);
              loadContainerData();
            }}
          />
        )}
      </div>
    </div>
  );
}
