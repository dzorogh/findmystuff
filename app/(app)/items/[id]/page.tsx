"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { EntityDetailSkeleton } from "@/components/entity-detail/entity-detail-skeleton";
import { EntityDetailError } from "@/components/entity-detail/entity-detail-error";
import { TransitionsTable } from "@/components/entity-detail/transitions-table";
import MoveEntityForm from "@/components/forms/move-entity-form";
import { getEntityDisplayName } from "@/lib/entities/helpers/display-name";
import { itemsEntityConfig } from "@/lib/entities/items/entity-config";
import { EntityImageCard } from "@/components/entity-detail/entity-image-card";
import { ErrorMessage } from "@/components/common/error-message";
import { useItemDetail } from "@/lib/entities/hooks/use-item-detail";
import { updateItem } from "@/lib/entities/api";
import { EntityTypeSelect } from "@/components/fields/entity-type-select";
import { PriceInput, type PriceValue } from "@/components/fields/price-input";
import { DatePicker } from "@/components/fields/date-picker";
import { PageHeader } from "@/components/layout/page-header";

export default function ItemDetailPage() {
  const {
    item,
    transitions,
    isLoading,
    isLoadingTransitions,
    error,
    isMoveDialogOpen,
    setIsMoveDialogOpen,
    handleEditSuccess,
    handleMoveSuccess,
    entityLabel,
    headerActions,
  } = useItemDetail();

  const [name, setName] = useState("");
  const [itemTypeId, setItemTypeId] = useState("");
  const [price, setPrice] = useState<PriceValue | null>(null);
  const [currentValue, setCurrentValue] = useState<PriceValue | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [purchaseDate, setPurchaseDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setName(item.name ?? "");
      setItemTypeId(item.item_type_id?.toString() ?? "");
      setPrice(
        item.price?.amount != null && item.price?.currency
          ? { amount: item.price.amount, currency: item.price.currency }
          : null
      );
      setCurrentValue(
        item.currentValue?.amount != null && item.currentValue?.currency
          ? { amount: item.currentValue.amount, currency: item.currentValue.currency }
          : null
      );
      setQuantity(item.quantity ?? 1);
      setPurchaseDate(item.purchaseDate ?? "");
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
        price_amount: price?.amount ?? null,
        price_currency: price?.currency ?? null,
        current_value_amount: currentValue?.amount ?? null,
        current_value_currency: currentValue?.currency ?? null,
        quantity: quantity >= 1 ? quantity : 1,
        purchase_date: purchaseDate.trim() || null,
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

  if (error && !isLoading) {
    return <EntityDetailError error={error} entityName={entityLabel} />;
  }

  if (!isLoading && !item) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        isLoading={isLoading}
        title={item?.name ?? (item ? `Вещь #${item.id}` : "Вещь")}
        ancestors={[
          { label: "Вещи", href: "/items" },
        ]}
        actions={headerActions}
      />
      {isLoading ? (
        <EntityDetailSkeleton />
      ) : item ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Редактирование вещи</CardTitle>
              <CardDescription>ID: #{item.id}</CardDescription>
            </CardHeader>
            <CardContent>
              <form id={`item-form-${item.id}`} onSubmit={handleSubmit}>
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

                  <EntityTypeSelect
                    type="item"
                    value={itemTypeId ? parseInt(itemTypeId) : null}
                    onValueChange={(v) => setItemTypeId(v ?? "")}
                  />

                  <PriceInput
                    value={price}
                    onChange={setPrice}
                    id={`item-price-${item.id}`}
                    disabled={isSubmitting}
                  />

                  <PriceInput
                    value={currentValue}
                    onChange={setCurrentValue}
                    id={`item-current-value-${item.id}`}
                    label="Текущая оценочная стоимость (необязательно)"
                    disabled={isSubmitting}
                  />

                  <Field>
                    <FieldLabel htmlFor={`item-quantity-${item.id}`}>Количество</FieldLabel>
                    <Input
                      id={`item-quantity-${item.id}`}
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      disabled={isSubmitting}
                    />
                  </Field>

                  <DatePicker
                    value={purchaseDate}
                    onChange={setPurchaseDate}
                    id={`item-purchase-date-${item.id}`}
                    label="Дата покупки"
                    placeholder="Выберите дату"
                    disabled={isSubmitting}
                  />

                  <ErrorMessage message={formError ?? ""} />
                </FieldGroup>
              </form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="submit" form={`item-form-${item.id}`} disabled={isSubmitting}>
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
            entityType="item"
            entityId={item.id}
            entityName={name}
            photoUrl={item.photo_url ?? null}
            onPhotoChange={async (url) => {
              const res = await updateItem(item.id, { photo_url: url });
              if (res.error) throw new Error(res.error);
              handleEditSuccess();
            }}
          />
          </div>

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
      ) : null}
    </div>
  );
}
