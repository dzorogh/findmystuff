"use client";

import { Package } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EntityDetailSkeleton } from "@/components/entity-detail/entity-detail-skeleton";
import { EntityDetailError } from "@/components/entity-detail/entity-detail-error";
import { EntityLocation } from "@/components/entity-detail/entity-location";
import { EntityPhoto } from "@/components/entity-detail/entity-photo";
import { EntityCreatedDate } from "@/components/entity-detail/entity-created-date";
import { TransitionsTable } from "@/components/entity-detail/transitions-table";
import EditItemForm from "@/components/forms/edit-item-form";
import MoveItemForm from "@/components/forms/move-item-form";
import { useItemDetail } from "@/lib/entities/hooks/use-item-detail";

export default function ItemDetailPage() {
  const {
    item,
    transitions,
    isLoading,
    isLoadingTransitions,
    error,
    isUserLoading,
    user,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isMoveDialogOpen,
    setIsMoveDialogOpen,
    handleEditSuccess,
    handleMoveSuccess,
    entityLabel,
  } = useItemDetail();

  if (isUserLoading || isLoading) {
    return <EntityDetailSkeleton />;
  }

  if (!user) {
    return null;
  }

  if (error || !item) {
    return <EntityDetailError error={error} entityName={entityLabel} />;
  }

  const displayName = item.name ?? `Вещь #${item.id}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{displayName}</CardTitle>
          <CardDescription>ID: #{item.id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <EntityPhoto
            photoUrl={item.photo_url}
            name={displayName}
            defaultIcon={<Package className="h-12 w-12 mx-auto text-muted-foreground" />}
            size="large"
            aspectRatio="video"
          />
          <EntityLocation location={item.last_location ?? null} variant="detailed" />
          <EntityCreatedDate createdAt={item.created_at} label="Создано" />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6">
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
      </div>

      {isEditDialogOpen && (
        <EditItemForm
          itemId={item.id}
          itemName={item.name}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={handleEditSuccess}
        />
      )}

      {isMoveDialogOpen && (
        <MoveItemForm
          itemId={item.id}
          itemName={item.name}
          open={isMoveDialogOpen}
          onOpenChange={setIsMoveDialogOpen}
          onSuccess={handleMoveSuccess}
        />
      )}
    </div>
  );
}
