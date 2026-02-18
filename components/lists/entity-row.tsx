"use client";

import { memo, useRef, type ComponentType, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { DoorOpen, Package, LayoutGrid, Container as ContainerIcon, Sofa } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { EntityActions } from "@/components/entity-detail/entity-actions";
import { getEntityDisplayName } from "@/lib/entities/helpers/display-name";
import type { Action } from "@/lib/app/types/entity-action";
import type { CountsConfig, ListColumnConfig } from "@/lib/app/types/entity-config";
import type {
  Item,
  Room,
  Place,
  Container,
  Building,
  Furniture,
  DestinationType,
} from "@/types/entity";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export const ROOM_EMPTY_LABEL = "Помещение не указано";
const LOCATION_EMPTY_LABEL = "Не указано";
const INTERACTIVE_SELECTOR = "a, button, [role='button'], input, textarea, select, label";

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

type ListEntity = Item | Room | Place | Container | Building | Furniture;
type IconComponent = ComponentType<{ className?: string }>;

interface EntityRowProps {
  entity: ListEntity;
  columnsConfig: ListColumnConfig[];
  /** Разрешённые действия для строки. */
  actions: Action[];
  /** Иконка из конфига списка (колонка «Название»). */
  icon?: IconComponent;
  /** Форматирование имени из конфига списка. */
  getName?: (entity: { id: number; name: string | null }) => string;
  /** Подпись помещения (для колонки room и под имени). */
  roomLabel?: string;
  /** Конфиг счётчиков (room, building, furniture, place). */
  counts?: CountsConfig;
}

const MD_HIDDEN_COLUMNS = new Set(["room", "counts"]);
const LG_HIDDEN_COLUMNS = new Set(["movedAt", "location"]);

/** Нейтральный fallback имени, если getName не передан из конфига. */
function getDisplayNameFallback(entity: { id: number; name: string | null }): string {
  const name = entity.name?.trim();
  return name !== undefined && name !== "" ? name : `#${entity.id}`;
}

function isFurnitureEntity(entity: ListEntity): entity is Furniture {
  return "room_id" in entity && "places_count" in entity && !("containers_count" in entity);
}

function isPlaceEntity(entity: ListEntity): entity is Place {
  return "room" in entity && !("places_count" in entity);
}

function renderCountLinks(
  entity: ListEntity,
  counts: CountsConfig | undefined,
  compact: boolean,
  extraContent?: ReactNode | null
): ReactNode {
  if (!counts?.links?.length && !extraContent) return null;
  const links = counts?.links?.filter((spec) => spec.field in entity) ?? [];
  if (links.length === 0 && !extraContent) return null;
  const iconClass = compact ? "h-3 w-3" : "h-4 w-4 flex-shrink-0 text-muted-foreground";
  const wrapperClass = compact
    ? "mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground md:hidden"
    : "flex flex-wrap gap-x-3 gap-y-1 text-sm";

  return (
    <div className={wrapperClass}>
      {links.map((spec) => {
        const Icon = spec.icon;
        const rawCount = (entity as unknown as Record<string, unknown>)[spec.field];
        const count = typeof rawCount === "number" ? rawCount : 0;
        const href = `${spec.path}?${counts!.filterParam}=${entity.id}`;
        return (
          <Link
            key={spec.field}
            href={href}
            className="flex items-center gap-1 transition-colors hover:text-primary"
            onClick={(e) => e.stopPropagation()}
          >
            <Icon className={iconClass} />
            <span>{count} {spec.label}</span>
          </Link>
        );
      })}
      {extraContent != null ? extraContent : null}
    </div>
  );
}

function getEntitySubline(entity: ListEntity): string | null {
  if ("item_type" in entity) return entity.item_type?.name ?? null;
  if ("room_type" in entity) return entity.room_type?.name ?? null;
  if ("building_type" in entity) return entity.building_type?.name ?? null;
  if ("entity_type" in entity) return entity.entity_type?.name ?? null;
  return null;
}

function getLocationInfo(location: Item["last_location"]) {
  if (!location?.destination_type) return null;
  const fallback =
    location.destination_name && location.destination_name.trim() !== ""
      ? location.destination_name
      : LOCATION_EMPTY_LABEL;

  return {
    destinationType: location.destination_type,
    label:
      location.destination_id != null
        ? getEntityDisplayName(
          location.destination_type,
          location.destination_id,
          location.destination_name
        )
        : fallback,
  };
}

const LOCATION_META: Record<
  DestinationType,
  { icon: IconComponent; textClass: string }
> = {
  room: { icon: DoorOpen, textClass: "text-primary" },
  place: { icon: LayoutGrid, textClass: "text-primary" },
  container: { icon: ContainerIcon, textClass: "text-primary" },
  furniture: { icon: Sofa, textClass: "text-primary" },
};

function renderLocationLabel(
  locationInfo: { destinationType: DestinationType; label: string },
  compact: boolean
) {
  const meta = LOCATION_META[locationInfo.destinationType];
  const Icon = meta.icon;

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Icon className="h-3 w-3 shrink-0" />
        <span className="truncate">{locationInfo.label}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className={cn("h-4 w-4 flex-shrink-0", meta.textClass)} />
      <span>{locationInfo.label}</span>
    </div>
  );
}

function formatRuDate(date: string): string {
  return new Date(date).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function renderNameCell(
  entity: ListEntity,
  roomLabel: string | undefined,
  editHref: string | undefined,
  icon: IconComponent | undefined,
  getName: ((entity: { id: number; name: string | null }) => string) | undefined,
  counts: CountsConfig | undefined
): ReactNode {
  const Icon = icon ?? Package;
  const displayName = getName?.(entity) ?? getDisplayNameFallback(entity);
  const subline = getEntitySubline(entity);
  const locationInfo = getLocationInfo(entity.last_location);
  const hasRoomInName = roomLabel !== undefined && entity.last_location != null;

  return (
    <div className="flex min-w-0 items-center gap-2">
      {entity.photo_url ? (
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded border border-border bg-muted">
          <Image
            src={entity.photo_url}
            alt={displayName}
            fill
            className="object-cover"
            sizes="40px"
          />
        </div>
      ) : (
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded border border-border bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <Link
          href={editHref ?? "#"}
          className="block overflow-hidden text-ellipsis break-words font-medium leading-tight"
        >
          {displayName}
        </Link>
        {subline && <p className="mt-0.5 text-xs text-muted-foreground">{subline}</p>}
        {hasRoomInName && (
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground md:hidden">
            <DoorOpen className="h-3 w-3 shrink-0" />
            <span className="truncate">{roomLabel}</span>
          </div>
        )}
        {renderCountLinks(
          entity,
          counts,
          true,
          (() => {
            if (
              counts?.filterParam === "placeId" &&
              ("furniture_name" in entity || ("room" in entity && entity.room))
            ) {
              return (
                <span className="flex items-center gap-1">
                  <Sofa className="h-3 w-3" />
                  <span className="truncate">
                    {"furniture_name" in entity && entity.furniture_name
                      ? "room" in entity && entity.room?.room_name
                        ? `${entity.furniture_name} (${entity.room.room_name})`
                        : entity.furniture_name
                      : "room" in entity ? entity.room?.room_name ?? "" : ""}
                  </span>
                </span>
              );
            }
            return undefined;
          })()
        )}
        {locationInfo && (
          <div className="mt-1 text-xs text-muted-foreground lg:hidden">
            {renderLocationLabel(locationInfo, true)}
          </div>
        )}
      </div>
    </div>
  );
}

function renderRoomCell(entity: ListEntity, roomLabel: string | undefined): ReactNode {
  if (roomLabel !== undefined && entity.last_location != null) {
    const label = roomLabel ?? ROOM_EMPTY_LABEL;
    return (
      <div className="flex items-center gap-2 text-sm">
        <DoorOpen className="h-4 w-4 flex-shrink-0 text-primary" />
        <span className={label === ROOM_EMPTY_LABEL ? "text-muted-foreground" : ""}>
          {label}
        </span>
      </div>
    );
  }

  if (isPlaceEntity(entity)) {
    const furnitureId = entity.furniture_id;
    const furnitureName = entity.furniture_name;
    const room = entity.room;
    if (furnitureId && furnitureName) {
      return (
        <div className="flex flex-col gap-0.5">
          <Link
            href={`/furniture/${furnitureId}`}
            className="flex items-center gap-2 text-sm transition-colors hover:text-primary"
          >
            <Sofa className="h-4 w-4 flex-shrink-0 text-primary" />
            <span>{furnitureName}</span>
          </Link>
          {room?.room_name && (
            <span className="text-xs text-muted-foreground ml-6 truncate">{room.room_name}</span>
          )}
        </div>
      );
    }
    if (room?.room_name && room.room_id) {
      return (
        <Link
          href={`/rooms/${room.room_id}`}
          className="flex items-center gap-2 text-sm transition-colors hover:text-primary"
        >
          <DoorOpen className="h-4 w-4 flex-shrink-0 text-primary" />
          <span>{room.room_name}</span>
        </Link>
      );
    }
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  if (isFurnitureEntity(entity) && entity.room_id && entity.room_name) {
    return (
      <Link
        href={`/rooms/${entity.room_id}`}
        className="flex items-center gap-2 text-sm transition-colors hover:text-primary"
      >
        <DoorOpen className="h-4 w-4 flex-shrink-0 text-primary" />
        <span>{entity.room_name}</span>
      </Link>
    );
  }

  return null;
}

function renderMovedAtCell(entity: ListEntity): ReactNode {
  const movedAt = entity.last_location?.moved_at;
  if (!movedAt) return null;
  return <span className="text-xs text-muted-foreground">{formatRuDate(movedAt)}</span>;
}

function renderCountsCell(entity: ListEntity, counts: CountsConfig | undefined): ReactNode {
  return renderCountLinks(entity, counts, false);
}

function renderLocationCell(entity: ListEntity): ReactNode {
  const locationInfo = getLocationInfo(entity.last_location);
  if (!locationInfo) return null;
  return renderLocationLabel(locationInfo, false);
}

function getEditHref(actions: Action[]): string | undefined {
  const edit = actions.find((a) => a.key === "edit" && "href" in a);
  return edit && "href" in edit ? edit.href : undefined;
}

function renderCellContent(
  columnKey: string,
  entity: ListEntity,
  actions: Action[],
  roomLabel: string | undefined,
  editHref: string | undefined,
  icon: IconComponent | undefined,
  getName: ((entity: { id: number; name: string | null }) => string) | undefined,
  counts: CountsConfig | undefined
): ReactNode {
  switch (columnKey) {
    case "id":
      return (
        <div className="flex items-center gap-2">
          {entity.deleted_at && (
            <Badge variant="destructive" className="text-xs">
              Удалено
            </Badge>
          )}
          <span className="text-muted-foreground">
            <span className="select-none">#</span>
            {entity.id}
          </span>
        </div>
      );

    case "name":
      return renderNameCell(entity, roomLabel, editHref, icon, getName, counts);

    case "room":
      return renderRoomCell(entity, roomLabel);

    case "movedAt":
      return renderMovedAtCell(entity);

    case "counts":
      return renderCountsCell(entity, counts);

    case "location":
      return renderLocationCell(entity);

    case "actions":
      return <EntityActions actions={actions} />;

    default:
      return null;
  }
}

function getResponsiveHiddenClass(column: ListColumnConfig): string {
  if (MD_HIDDEN_COLUMNS.has(column.key)) return "hidden md:table-cell";
  if (LG_HIDDEN_COLUMNS.has(column.key)) return "hidden lg:table-cell";
  if (column.hideOnMobile) return "hidden sm:table-cell";
  return "";
}

export const EntityRow = memo(function EntityRow({
  entity,
  columnsConfig,
  actions,
  icon,
  getName,
  roomLabel,
  counts,
}: EntityRowProps) {
  const router = useRouter();
  const pointerStartedOnRowRef = useRef(false);
  const editHref = getEditHref(actions);

  const isInteractiveTarget = (target: HTMLElement) =>
    Boolean(target.closest(INTERACTIVE_SELECTOR));

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    pointerStartedOnRowRef.current = e.button === 0 && !isInteractiveTarget(target);
  };

  const handleRowClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const canNavigate = pointerStartedOnRowRef.current && !isInteractiveTarget(target);
    pointerStartedOnRowRef.current = false;
    if (!canNavigate) return;
    if (editHref) router.push(editHref);
  };

  return (
    <TableRow
      className={cn(entity.deleted_at ? "opacity-60" : "", "cursor-pointer")}
      onPointerDown={handlePointerDown}
      onPointerCancel={() => {
        pointerStartedOnRowRef.current = false;
      }}
      onClick={handleRowClick}
    >
      {columnsConfig.map((col) => {
        const cellContent = renderCellContent(
          col.key,
          entity,
          actions,
          roomLabel,
          editHref,
          icon,
          getName,
          counts
        );
        const responsiveHidden = getResponsiveHiddenClass(col);

        return (
          <TableCell
            key={col.key}
            className={cn(
              col.key === "actions" && "text-right",
              col.width,
              responsiveHidden,
              "overflow-hidden text-ellipsis max-w-0"
            )}
          >
            {cellContent}
          </TableCell>
        );
      })}
    </TableRow>
  );
});
