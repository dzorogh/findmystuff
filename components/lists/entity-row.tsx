"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  Package,
  Warehouse,
  Container as ContainerIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { EntityActions } from "@/lib/entities/components/entity-actions";
import { getEntityDisplayName } from "@/lib/entities/helpers/display-name";
import type {
  ListColumnConfig,
  ListActionsConfig,
} from "@/lib/app/types/list-config";
import type { EntityActionsCallbacks } from "@/lib/entities/components/entity-actions";
import type { Item, Room, Place, Container } from "@/types/entity";
import { cn } from "@/lib/utils";

export const ROOM_EMPTY_LABEL = "Помещение не указано";

export function getRoomLabel(location: Item["last_location"]): string | null {
  if (!location) return null;
  return (
    location.room_name ??
    location.destination_name ??
    (location.destination_id != null
      ? `Помещение #${location.destination_id}`
      : null)
  );
}

export type ListEntityType = "items" | "rooms" | "places" | "containers";

type ListEntity = Item | Room | Place | Container;

interface EntityRowProps {
  entityType: ListEntityType;
  entity: ListEntity;
  columnsConfig: ListColumnConfig[];
  actionsConfig: ListActionsConfig;
  actionCallbacks: EntityActionsCallbacks;
  /** Для items: подпись помещения (из last_location). */
  roomLabel?: string;
}

function getDefaultIcon(entityType: ListEntityType) {
  switch (entityType) {
    case "items":
      return Package;
    case "rooms":
      return Building2;
    case "places":
      return Warehouse;
    case "containers":
      return ContainerIcon;
  }
}

function renderCellContent(
  entityType: ListEntityType,
  columnKey: string,
  entity: ListEntity,
  roomLabel?: string
): React.ReactNode {
  const id = entity.id;
  const name = entity.name;
  const deletedAt = entity.deleted_at;
  const photoUrl = entity.photo_url;
  const editHref =
    entityType === "items"
      ? `/items/${id}`
      : entityType === "rooms"
        ? `/rooms/${id}`
        : entityType === "places"
          ? `/places/${id}`
          : `/containers/${id}`;

  switch (columnKey) {
    case "id":
      return (
        <div className="flex items-center gap-2">
          {deletedAt && (
            <Badge variant="destructive" className="text-xs">
              Удалено
            </Badge>
          )}
          <span className="text-muted-foreground">#{id}</span>
        </div>
      );

    case "name": {
      const Icon = getDefaultIcon(entityType);
      const displayName =
        entityType === "containers"
          ? getEntityDisplayName("container", id, name)
          : name || (entityType === "items" ? `Вещь #${id}` : entityType === "rooms" ? `Помещение #${id}` : entityType === "places" ? `Место #${id}` : `Контейнер #${id}`);
      const subline =
        "item_type" in entity && entity.item_type?.name
          ? entity.item_type.name
          : "room_type" in entity && entity.room_type?.name
            ? entity.room_type.name
            : "entity_type" in entity && entity.entity_type?.name
              ? entity.entity_type.name
              : null;

      return (
        <div className="flex items-center gap-2 min-w-0">
          {photoUrl ? (
            <div className="relative h-10 w-10 flex-shrink-0 rounded overflow-hidden border border-border bg-muted">
              <Image
                src={photoUrl}
                alt={displayName}
                fill
                className="object-cover"
                sizes="40px"
                unoptimized={photoUrl.includes("storage.supabase.co")}
              />
            </div>
          ) : (
            <div className="h-10 w-10 flex-shrink-0 rounded border border-border bg-muted flex items-center justify-center">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <Link
              href={editHref}
              className="font-medium hover:underline break-words leading-tight block"
            >
              {displayName}
            </Link>
            {subline && (
              <p className="text-xs text-muted-foreground mt-0.5">{subline}</p>
            )}
            {entityType === "items" && roomLabel !== undefined && (
              <div className="md:hidden mt-1 text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3 shrink-0" />
                <span className="truncate">{roomLabel}</span>
              </div>
            )}
            {entityType === "rooms" && "items_count" in entity && (
              <div className="md:hidden mt-1 text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                <span className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  {(entity as Room).items_count ?? 0} вещ.
                </span>
                <span className="flex items-center gap-1">
                  <Warehouse className="h-3 w-3" />
                  {(entity as Room).places_count ?? 0} мест
                </span>
                <span className="flex items-center gap-1">
                  <ContainerIcon className="h-3 w-3" />
                  {(entity as Room).containers_count ?? 0} конт.
                </span>
              </div>
            )}
            {entityType === "places" && "items_count" in entity && (
              <div className="md:hidden mt-1 text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                <span className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  {(entity as Place).items_count ?? 0} вещ.
                </span>
                <span className="flex items-center gap-1">
                  <ContainerIcon className="h-3 w-3" />
                  {(entity as Place).containers_count ?? 0} конт.
                </span>
                {"room" in entity && (entity as Place).room?.room_name && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    <span className="truncate">
                      {(entity as Place).room!.room_name}
                    </span>
                  </span>
                )}
              </div>
            )}
            {entityType === "containers" && "last_location" in entity && (
              <div className="lg:hidden mt-1 text-xs text-muted-foreground">
                {(entity as Container).last_location ? (
                  <div className="flex items-center gap-1">
                    {(entity as Container).last_location!.destination_type ===
                      "room" && (
                      <>
                        <Building2 className="h-3 w-3" />
                        <span className="truncate">
                          {getEntityDisplayName(
                            "room",
                            (entity as Container).last_location!.destination_id!,
                            (entity as Container).last_location!
                              .destination_name
                          )}
                        </span>
                      </>
                    )}
                    {(entity as Container).last_location!.destination_type ===
                      "place" && (
                      <>
                        <Warehouse className="h-3 w-3" />
                        <span className="truncate">
                          {getEntityDisplayName(
                            "place",
                            (entity as Container).last_location!.destination_id!,
                            (entity as Container).last_location!
                              .destination_name
                          )}
                        </span>
                      </>
                    )}
                    {(entity as Container).last_location!.destination_type ===
                      "container" && (
                      <>
                        <ContainerIcon className="h-3 w-3" />
                        <span className="truncate">
                          {getEntityDisplayName(
                            "container",
                            (entity as Container).last_location!.destination_id!,
                            (entity as Container).last_location!
                              .destination_name
                          )}
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <span>Местоположение не указано</span>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    case "room":
      if (entityType === "items") {
        const label = roomLabel ?? ROOM_EMPTY_LABEL;
        return (
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
            <span
              className={
                label === ROOM_EMPTY_LABEL ? "text-muted-foreground" : ""
              }
            >
              {label}
            </span>
          </div>
        );
      }
      if (entityType === "places") {
        const place = entity as Place;
        const room = place.room;
        if (room?.room_name && room.room_id) {
          return (
            <Link
              href={`/rooms/${room.room_id}`}
              className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
            >
              <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
              <span>{room.room_name}</span>
            </Link>
          );
        }
        return <span className="text-sm text-muted-foreground">—</span>;
      }
      return null;

    case "movedAt":
      if (entityType === "items" && "last_location" in entity) {
        const movedAt = (entity as Item).last_location?.moved_at;
        return (
          <span className="text-xs text-muted-foreground">
            {movedAt
              ? new Date(movedAt).toLocaleDateString("ru-RU", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "—"}
          </span>
        );
      }
      return null;

    case "counts":
      if (entityType === "rooms") {
        const room = entity as Room;
        return (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
            <div className="flex items-center gap-1">
              <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{room.items_count ?? 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Warehouse className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{room.places_count ?? 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <ContainerIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{room.containers_count ?? 0}</span>
            </div>
          </div>
        );
      }
      return null;

    case "location":
      if (entityType === "containers") {
        const cont = entity as Container;
        const loc = cont.last_location;
        if (!loc)
          return (
            <span className="text-sm text-muted-foreground">Не указано</span>
          );
        if (loc.destination_type === "room")
          return (
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
              <span>
                {getEntityDisplayName(
                  "room",
                  loc.destination_id!,
                  loc.destination_name
                )}
              </span>
            </div>
          );
        if (loc.destination_type === "place")
          return (
            <div className="flex items-center gap-2 text-sm">
              <Warehouse className="h-4 w-4 text-primary flex-shrink-0" />
              <span>
                {getEntityDisplayName(
                  "place",
                  loc.destination_id!,
                  loc.destination_name
                )}
              </span>
            </div>
          );
        if (loc.destination_type === "container")
          return (
            <div className="flex items-center gap-2 text-sm">
              <ContainerIcon className="h-4 w-4 text-primary flex-shrink-0" />
              <span>
                {getEntityDisplayName(
                  "container",
                  loc.destination_id!,
                  loc.destination_name
                )}
              </span>
            </div>
          );
        return null;
      }
      return null;

    default:
      return null;
  }
}

export const EntityRow = memo(function EntityRow({
  entityType,
  entity,
  columnsConfig,
  actionsConfig,
  actionCallbacks,
  roomLabel,
}: EntityRowProps) {
  const isDeleted = !!entity.deleted_at;

  return (
    <TableRow className={entity.deleted_at ? "opacity-60" : ""}>
      {columnsConfig.map((col) => {
        const cellContent =
          col.key === "actions" ? (
            <EntityActions
              actionsConfig={actionsConfig}
              callbacks={actionCallbacks}
              isDeleted={isDeleted}
            />
          ) : (
            renderCellContent(
              entityType,
              col.key,
              entity,
              roomLabel
            )
          );

        const responsiveHidden =
          col.key === "room" || col.key === "counts"
            ? "hidden md:table-cell"
            : col.key === "movedAt" || col.key === "location"
              ? "hidden lg:table-cell"
              : col.hideOnMobile
                ? "hidden sm:table-cell"
                : "";

        return (
          <TableCell
            key={col.key}
            className={cn(
              col.key === "actions" && "text-right",
              col.width,
              responsiveHidden
            )}
          >
            {cellContent}
          </TableCell>
        );
      })}
    </TableRow>
  );
});
