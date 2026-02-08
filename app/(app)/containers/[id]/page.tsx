"use client";

import { useState, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useCurrentPage } from "@/lib/app/contexts/current-page-context";
import { useUser } from "@/lib/users/context";
import { getContainer, updateContainer } from "@/lib/containers/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { FormField } from "@/components/ui/form-field";
import { FormGroup } from "@/components/ui/form-group";
import { useEntityDataLoader } from "@/lib/entities/hooks/use-entity-data-loader";
import { useEntityTypes } from "@/lib/entities/hooks/use-entity-types";
import { EntityDetailSkeleton } from "@/components/entity-detail/entity-detail-skeleton";
import { EntityDetailError } from "@/components/entity-detail/entity-detail-error";
import { EntityActions } from "@/components/entity-detail/entity-actions";
import { EntityLocation } from "@/components/entity-detail/entity-location";
import { TransitionsTable } from "@/components/entity-detail/transitions-table";
import { EntityContentGrid } from "@/components/entity-detail/entity-content-grid";
import MoveEntityForm from "@/components/forms/move-entity-form";
import { CONTAINERS_LIST_CONFIG } from "@/lib/entities/containers/list-config";
import ImageUpload from "@/components/fields/image-upload";
import { ErrorMessage } from "@/components/common/error-message";
import { useEntityActions } from "@/lib/entities/hooks/use-entity-actions";
import { usePrintEntityLabel } from "@/lib/entities/hooks/use-print-entity-label";
import { getEntityDisplayName } from "@/lib/entities/helpers/display-name";
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
  const [isMoving, setIsMoving] = useState(false);

  const { types: containerTypes } = useEntityTypes("container");
  const [name, setName] = useState("");
  const [containerTypeId, setContainerTypeId] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
      const response = await getContainer(containerId);

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

  useEffect(() => {
    if (container) {
      setName(container.name ?? "");
      setContainerTypeId(container.entity_type_id?.toString() ?? "");
      setPhotoUrl(container.photo_url ?? null);
    }
  }, [container]);

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
        showEdit={false}
        onEdit={() => { }}
        onMove={() => setIsMoving(true)}
        onPrintLabel={() => printLabel(container.id, container.name)}
        onDelete={handleDelete}
        onRestore={handleRestore}
      />
    );
    return () => setEntityActions(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers from hooks; re-run only when entity/loading state changes
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

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!container) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      const response = await updateContainer(container.id, {
        name: name.trim() || undefined,
        entity_type_id: containerTypeId ? parseInt(containerTypeId, 10) : null,
        photo_url: photoUrl || undefined,
      });
      if (response.error) throw new Error(response.error);
      toast.success("Контейнер успешно обновлен");
      loadContainerData();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Произошла ошибка при сохранении"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Редактирование контейнера</CardTitle>
            <CardDescription className="flex items-center gap-2 flex-wrap">
              ID: #{container.id}
              {container.deleted_at && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <Badge variant="destructive">Удалено</Badge>
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleEditSubmit}>
              <FormGroup>
                <FormField
                  label="Название контейнера"
                  htmlFor={`container-name-${container.id}`}
                >
                  <Input
                    id={`container-name-${container.id}`}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Введите название контейнера"
                    disabled={isSubmitting}
                  />
                </FormField>

                <FormField
                  label="Тип контейнера"
                  htmlFor={`container-type-${container.id}`}
                >
                  <Combobox
                    items={[
                      { value: "", label: "Не указан" },
                      ...containerTypes.map((type) => ({
                        value: type.id.toString(),
                        label: type.name,
                      })),
                    ]}
                    value={containerTypeId}
                    onValueChange={(v) => setContainerTypeId(v ?? "")}
                    disabled={isSubmitting}
                  />
                </FormField>

                <ImageUpload
                  value={photoUrl}
                  onChange={setPhotoUrl}
                  disabled={isSubmitting}
                  label="Фотография контейнера (необязательно)"
                />

                <EntityLocation
                  location={container.last_location ?? null}
                  variant="detailed"
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
      </div>

      <div className="flex flex-col gap-4">
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
      </div>

      {isMoving && container && (
        <MoveEntityForm
          title="Переместить контейнер"
          entityDisplayName={getEntityDisplayName("container", container.id, container.name)}
          destinationTypes={CONTAINERS_LIST_CONFIG.moveFormConfig.destinationTypes ?? ["room", "place", "container"]}
          buildPayload={(destinationType, destinationId) => ({
            container_id: container.id,
            destination_type: destinationType,
            destination_id: destinationId,
          })}
          getSuccessMessage={(name) => `Контейнер успешно перемещён в ${name}`}
          getErrorMessage={() => "Произошла ошибка при перемещении контейнера"}
          excludeContainerId={container.id}
          open={isMoving}
          onOpenChange={setIsMoving}
          onSuccess={() => {
            setIsMoving(false);
            loadContainerData();
          }}
        />
      )}
    </div>
  );
}
