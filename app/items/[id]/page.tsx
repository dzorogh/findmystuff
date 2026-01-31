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
import { Package } from "lucide-react";

// Компоненты entity-detail
import { useEntityDataLoader } from "@/hooks/use-entity-data-loader";
import { EntityDetailSkeleton } from "@/components/entity-detail/entity-detail-skeleton";
import { EntityDetailError } from "@/components/entity-detail/entity-detail-error";
import { EntityHeader } from "@/components/entity-detail/entity-header";
import { EntityActions } from "@/components/entity-detail/entity-actions";
import { EntityLocation } from "@/components/entity-detail/entity-location";
import { EntityPhoto } from "@/components/entity-detail/entity-photo";
import { EntityCreatedDate } from "@/components/entity-detail/entity-created-date";
import { TransitionsTable } from "@/components/entity-detail/transitions-table";

// Формы
import EditItemForm from "@/components/forms/edit-item-form";
import MoveItemForm from "@/components/forms/move-item-form";

// Утилиты
import { useEntityActions } from "@/hooks/use-entity-actions";
import { usePrintEntityLabel } from "@/hooks/use-print-entity-label";

// Типы
import type { Transition, ItemEntity } from "@/types/entity";

type Item = ItemEntity;

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = parseInt(params.id as string);
  const { user, isLoading: isUserLoading } = useUser();
  const { setEntityName, setIsLoading } = useCurrentPage();
  const [item, setItem] = useState<Item | null>(null);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [isLoading, setIsPageLoading] = useState(true);
  const [isLoadingTransitions, setIsLoadingTransitions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/");
    }
  }, [isUserLoading, user, router]);

  const loadItemData = useCallback(async () => {
    if (!user) return;

    setIsPageLoading(true);
    setIsLoading(true); // Устанавливаем загрузку в контекст для TopBar
    setError(null);

    try {
      // Сначала загружаем основную информацию о вещи (без transitions)
      const response = await apiClient.getItem(itemId, false);

      // Проверяем наличие ошибки в ответе
      if (response.error) {
        setError(response.error);
        setIsPageLoading(false);
        setIsLoading(false);
        setEntityName(null);
        return;
      }

      // API endpoint возвращает { item } без transitions
      // Структура: { data: { item }, error?: string }
      if (!response.data || !response.data.item) {
        setError("Вещь не найдена");
        setIsPageLoading(false);
        setIsLoading(false);
        setEntityName(null);
        return;
      }

      const { item } = response.data;

      setItem(item);

      // Устанавливаем имя в контекст сразу после получения данных вещи
      // чтобы оно отображалось в крошках как можно раньше
      const nameToSet = item.name || `Вещь #${item.id}`;
      flushSync(() => {
        setEntityName(nameToSet);
      });
      setIsLoading(false);
      setIsPageLoading(false);

      // После загрузки основной информации загружаем transitions
      setIsLoadingTransitions(true);
      try {
        const transitionsResponse = await apiClient.getItemTransitions(itemId);
        if (transitionsResponse.error) {
          console.error("Ошибка загрузки transitions:", transitionsResponse.error);
          // Не устанавливаем ошибку, просто оставляем пустой массив
          setTransitions([]);
        } else {
          setTransitions(transitionsResponse.data || []);
        }
      } catch (transitionsErr) {
        console.error("Ошибка загрузки transitions:", transitionsErr);
        setTransitions([]);
      } finally {
        setIsLoadingTransitions(false);
      }
    } catch (err) {
      console.error("Ошибка загрузки данных вещи:", err);
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных");
      setIsLoading(false); // Загрузка завершена с ошибкой
      setEntityName(null);
      setIsPageLoading(false);
    }
  }, [user, itemId, setEntityName, setIsLoading]);

  useEntityDataLoader({
    user,
    isUserLoading,
    entityId: itemId,
    loadData: loadItemData,
  });

  const { isDeleting, isRestoring, handleDelete, handleRestore } = useEntityActions({
    entityType: "items",
    entityId: itemId,
    entityName: "Вещь",
    onSuccess: loadItemData,
  });

  const printLabel = usePrintEntityLabel("item");

  if (isUserLoading || isLoading) {
    return <EntityDetailSkeleton />;
  }

  if (!user) {
    return null;
  }

  if (error || !item) {
    return <EntityDetailError error={error} entityName="Вещь" />;
  }

  return (
    <div className="container pb-10 pt-4 px-4 md:py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <EntityHeader
            id={item.id}
            name={item.name}
            photoUrl={item.photo_url}
            isDeleted={!!item.deleted_at}
            defaultIcon={<Package className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />}
            defaultName="Вещь"
            actions={
              <EntityActions
                isDeleted={!!item.deleted_at}
                isDeleting={isDeleting}
                isRestoring={isRestoring}
                onEdit={() => setIsEditDialogOpen(true)}
                onMove={() => setIsMoveDialogOpen(true)}
                onPrintLabel={item ? () => printLabel(item.id, item.name) : undefined}
                onDelete={handleDelete}
                onRestore={handleRestore}
              />
            }
            layout="compact"
          />
          <CardContent className="space-y-4">
            <EntityPhoto
              photoUrl={item.photo_url}
              name={item.name || `Вещь #${item.id}`}
              defaultIcon={<Package className="h-12 w-12 mx-auto text-muted-foreground" />}
              size="large"
              aspectRatio="video"
            />
            <EntityLocation location={item.last_location || null} variant="detailed" />
            <EntityCreatedDate createdAt={item.created_at} label="Создано" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>История перемещений</CardTitle>
            <CardDescription>
              Все перемещения этой вещи в хронологическом порядке
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TransitionsTable
              transitions={transitions}
              emptyMessage="История перемещений пуста"
              isLoading={isLoadingTransitions}
            />
          </CardContent>
        </Card>

        {isEditDialogOpen && item && (
          <EditItemForm
            itemId={item.id}
            itemName={item.name}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSuccess={() => {
              setIsEditDialogOpen(false);
              loadItemData();
            }}
          />
        )}

        {isMoveDialogOpen && item && (
          <MoveItemForm
            itemId={item.id}
            itemName={item.name}
            open={isMoveDialogOpen}
            onOpenChange={setIsMoveDialogOpen}
            onSuccess={() => {
              setIsMoveDialogOpen(false);
              loadItemData();
            }}
          />
        )}
      </div>
    </div>
  );
}
