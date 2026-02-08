"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { EntityDetailSkeleton } from "@/components/entity-detail/entity-detail-skeleton";
import { EntityDetailError } from "@/components/entity-detail/entity-detail-error";
import { TransitionsTable } from "@/components/entity-detail/transitions-table";
import MoveEntityForm from "@/components/forms/move-entity-form";
import { getEntityDisplayName } from "@/lib/entities/helpers/display-name";
import { itemsEntityConfig } from "@/lib/entities/items/entity-config";
import ImageUpload from "@/components/fields/image-upload";
import { ErrorMessage } from "@/components/common/error-message";
import { useItemDetail } from "@/lib/entities/hooks/use-item-detail";
import { useEntityTypes } from "@/lib/entities/hooks/use-entity-types";
import { updateItem } from "@/lib/entities/api";
import { ItemTypeSelect } from "@/components/fields/item-type-select";
import { PageHeader } from "@/components/layout/page-header";

export default function ItemDetailPage() {
  const {
    item,
    transitions,
    isLoading,
    isLoadingTransitions,
    error,
    isUserLoading,
    user,
    isMoveDialogOpen,
    setIsMoveDialogOpen,
    handleEditSuccess,
    handleMoveSuccess,
    entityLabel,
  } = useItemDetail();

  const [name, setName] = useState("");
  const [itemTypeId, setItemTypeId] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setName(item.name ?? "");
      setItemTypeId(item.item_type_id?.toString() ?? "");
      setPhotoUrl(item.photo_url ?? null);
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!item) return;
    setFormError(null);
    setIsSubmitting(true);

    try {
      const response = await updateItem(item.id, {
        name: name.trim() || undefined,
        item_type_id: itemTypeId ? parseInt(itemTypeId) : null,
        photo_url: photoUrl || undefined,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast.success("Вещь успешно обновлена");
      handleEditSuccess();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Произошла ошибка при сохранении"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading || isLoading) {
    return <EntityDetailSkeleton />;
  }

  if (!user) {
    return null;
  }

  if (error || !item) {
    return <EntityDetailError error={error} entityName={entityLabel} />;
  }

  return (
    <div className="flex flex-col gap-2">
      <PageHeader
        title={item.name ?? `Вещь #${item.id}`}
        ancestors={[
          { label: "Вещи", href: "/items" },
        ]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <Card>
          <CardHeader>
            <CardTitle>Редактирование вещи</CardTitle>
            <CardDescription>ID: #{item.id}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor={`item-name-${item.id}`}>Название вещи</FieldLabel>
                  <Input
                    id={`item-name-${item.id}`}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Введите название вещи"
                    disabled={isSubmitting}
                  />
                </Field>

                <ItemTypeSelect
                  value={itemTypeId ? parseInt(itemTypeId) : null}
                  onValueChange={(v) => setItemTypeId(v ?? "")}
                />

                <ImageUpload
                  value={photoUrl}
                  onChange={setPhotoUrl}
                  disabled={isSubmitting}
                  label="Фотография вещи (необязательно)"
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
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          <Card>
            <CardHeader>
              <CardTitle>История перемещений</CardTitle>
            </CardHeader>
            <CardContent>
              <TransitionsTable
                transitions={transitions}
                emptyMessage="История перемещений пуста"
                isLoading={isLoadingTransitions}
              />
            </CardContent>
          </Card>
        </div>

        {isMoveDialogOpen && item && (
          <MoveEntityForm
            title={itemsEntityConfig.labels.moveTitle}
            entityDisplayName={getEntityDisplayName("item", item.id, item.name)}
            destinationTypes={itemsEntityConfig.actions.move?.destinationTypes ?? ["room", "place", "container"]}
            buildPayload={(destinationType, destinationId) => ({
              item_id: item.id,
              destination_type: destinationType,
              destination_id: destinationId,
            })}
            getSuccessMessage={itemsEntityConfig.labels.moveSuccess}
            getErrorMessage={() => itemsEntityConfig.labels.moveError}
            open={isMoveDialogOpen}
            onOpenChange={setIsMoveDialogOpen}
            onSuccess={handleMoveSuccess}
          />
        )}
      </div>
    </div>
  );
}
