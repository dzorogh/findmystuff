"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getContainer, updateContainer } from "@/lib/containers/api";
import { logError } from "@/lib/shared/logger";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useEntityDataLoader } from "@/lib/entities/hooks/use-entity-data-loader";
import { useEntityTypes } from "@/lib/entities/hooks/use-entity-types";
import { EntityDetailSkeleton } from "@/components/entity-detail/entity-detail-skeleton";
import { EntityDetailError } from "@/components/entity-detail/entity-detail-error";
import { EntityActions } from "@/components/entity-detail/entity-actions";
import { resolveActions } from "@/lib/entities/resolve-actions";
import { TransitionsTable } from "@/components/entity-detail/transitions-table";
import { EntityContentBlock } from "@/components/entity-detail/entity-content-block";
import AddItemForm from "@/components/forms/add-item-form";
import { EntityRelatedLinks } from "@/components/entity-detail/entity-related-links";
import MoveEntityForm from "@/components/forms/move-entity-form";
import { containersEntityConfig } from "@/lib/entities/containers/entity-config";
import { EntityImageCard } from "@/components/entity-detail/entity-image-card";
import { ErrorMessage } from "@/components/common/error-message";
import { useEntityActions } from "@/lib/entities/hooks/use-entity-actions";
import { usePrintEntityLabel } from "@/lib/entities/hooks/use-print-entity-label";
import { getEntityDisplayName } from "@/lib/entities/helpers/display-name";
import type { Transition, Container } from "@/types/entity";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTypeSelect } from "@/components/fields/entity-type-select";

function parseContainerId(id: unknown): number | null {
  if (id == null || typeof id !== "string" || id.trim() === "") return null;
  const parsed = parseInt(id.trim(), 10);
  if (Number.isNaN(parsed) || !Number.isInteger(parsed)) return null;
  return parsed;
}

export default function ContainerDetailPage() {
  const params = useParams();
  const containerId = parseContainerId(params?.id) ?? NaN;
  const isInvalidId = Number.isNaN(containerId);
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
  const [addItemOpen, setAddItemOpen] = useState(false);

  const { types: _containerTypes } = useEntityTypes("container");
  const [name, setName] = useState("");
  const [containerTypeId, setContainerTypeId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadContainerData = useCallback(
    async (options?: { silent?: boolean }) => {
      if (Number.isNaN(containerId)) return;

      const silent = options?.silent ?? false;
      if (!silent) setIsPageLoading(true);
      setError(null);

      try {
        const response = await getContainer(containerId);

        if (response.error || !response.data) {
          setError("Контейнер не найден");
          if (!silent) setIsPageLoading(false);
          return;
        }

        const { container: containerData, transitions: transitionsWithNames, items } = response.data;

        if (!containerData) {
          setError("Контейнер не найден");
          if (!silent) setIsPageLoading(false);
          return;
        }

        setContainer(containerData);
        setTransitions(transitionsWithNames);
        setContainerItems(items || []);
      } catch (err) {
        logError("Ошибка загрузки данных контейнера:", err);
        setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных");
      } finally {
        if (!silent) setIsPageLoading(false);
      }
    },
    [containerId]
  );

  useEntityDataLoader({
    entityId: containerId,
    loadData: loadContainerData,
  });

  const { handleDelete, handleRestore } = useEntityActions({
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
    }
  }, [container]);

  const containerCtx = useMemo(
    () => ({
      refreshList: () => loadContainerData({ silent: true }),
      printLabel: (id: number, name?: string | null) => printLabel(id, name ?? null),
      handleDelete,
      handleRestore,
    }),
    [loadContainerData, printLabel, handleDelete, handleRestore]
  );

  if (isInvalidId) {
    return <EntityDetailError error="Некорректный ID контейнера" entityName="Контейнер" />;
  }

  if (error && !isLoading) {
    return <EntityDetailError error={error} entityName="Контейнер" />;
  }

  if (!isLoading && !container) {
    return null;
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
      });
      if (response.error) throw new Error(response.error);
      toast.success("Контейнер успешно обновлен");
      loadContainerData({ silent: true });
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Произошла ошибка при сохранении"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const headerActions =
    container != null ? (
      <EntityActions actions={resolveActions(containersEntityConfig.actions, container, containerCtx)} />
    ) : null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        isLoading={isLoading}
        title={container?.name ?? (container ? `Контейнер #${container.id}` : "Контейнер")}
        ancestors={[
          { label: "Контейнеры", href: "/containers" },
        ]}
        actions={headerActions}
      />
      {container && (
        <EntityRelatedLinks
          links={[{ href: `/items?containerId=${container.id}`, label: "Вещи" }]}
        />
      )}
      {isLoading ? (
        <EntityDetailSkeleton />
      ) : container ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-6">
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
              <CardContent>
                <form id={`container-form-${container.id}`} onSubmit={handleEditSubmit}>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor={`container-name-${container.id}`}>Название контейнера</FieldLabel>
                      <Input
                        id={`container-name-${container.id}`}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Введите название контейнера"
                        disabled={isSubmitting}
                      />
                    </Field>

                    <EntityTypeSelect
                      type="container"
                      value={containerTypeId ? parseInt(containerTypeId) : null}
                      onValueChange={(v) => setContainerTypeId(v ?? "")}
                    />

                    <ErrorMessage message={formError ?? ""} />
                  </FieldGroup>
                </form>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="submit" form={`container-form-${container.id}`} disabled={isSubmitting}>
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
              entityType="container"
              entityId={container.id}
              entityName={name}
              photoUrl={container.photo_url ?? null}
              onPhotoChange={async (url) => {
                const res = await updateContainer(container.id, { photo_url: url });
                if (res.error) throw new Error(res.error);
                await loadContainerData({ silent: true });
              }}
            />
          </div>

          <div className="flex flex-col gap-6">
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

            <EntityContentBlock
              title="Содержимое контейнера"
              description="Вещи, которые находятся в этом контейнере"
              items={containerItems}
              entityType="items"
              emptyMessage="Контейнер пуст"
              addButton={{
                label: "Добавить вещь",
                onClick: () => setAddItemOpen(true),
              }}
            />
          </div>

          <AddItemForm
            open={addItemOpen}
            onOpenChange={setAddItemOpen}
            onSuccess={() => loadContainerData({ silent: true })}
            initialDestinationType="container"
            initialDestinationId={container?.id ?? undefined}
          />

          {isMoving && container && (
            <MoveEntityForm
              title={containersEntityConfig.labels.moveTitle}
              entityDisplayName={getEntityDisplayName("container", container.id, container.name)}
              destinationTypes={containersEntityConfig.move?.destinationTypes ?? ["room", "place", "container"]}
              buildPayload={(destinationType, destinationId) => ({
                container_id: container.id,
                destination_type: destinationType,
                destination_id: destinationId,
              })}
              getSuccessMessage={containersEntityConfig.labels.moveSuccess}
              getErrorMessage={() => containersEntityConfig.labels.moveError}
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
      ) : null}
    </div>
  );
}
