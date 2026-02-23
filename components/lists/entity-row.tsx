"use client";

import { memo, useRef, type ComponentType, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { DoorOpen, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { EntityActions } from "@/components/entity-detail/entity-actions";
import { getEntityDisplayName } from "@/lib/entities/helpers/display-name";
import type { Action } from "@/lib/app/types/entity-action";
import type { CountsConfig, ListColumnConfig } from "@/lib/app/types/entity-config";
import type { Item, Room, Place, Container, Building, Furniture } from "@/types/entity";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export const ROOM_EMPTY_LABEL = "Помещение не указано";
const INTERACTIVE_SELECTOR = "a, button, [role='button'], input, textarea, select, label";
/** Оверлеи (sheet, dialog) — клик по ним не должен вызывать переход по строке */
const OVERLAY_SELECTOR = "[data-slot='sheet-overlay'], [data-base-ui-inert]";

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

function renderCountLinks(
  entity: ListEntity,
  counts: CountsConfig | undefined
): ReactNode {
  if (!counts?.links?.length) return null;
  const links = counts.links.filter((spec) => spec.field in entity);
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
      {links.map((spec) => {
        const Icon = spec.icon;
        const rawCount = (entity as unknown as Record<string, unknown>)[spec.field];
        const count = typeof rawCount === "number" ? rawCount : 0;
        const href = `${spec.path}?${counts.filterParam}=${entity.id}`;
        return (
          <Link
            key={spec.field}
            href={href}
            className="flex items-center gap-1 transition-colors hover:text-primary"
            onClick={(e) => e.stopPropagation()}
          >
            <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <span>{count} {spec.label}</span>
          </Link>
        );
      })}
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
  editHref: string | undefined,
  icon: IconComponent | undefined,
  getName: ((entity: { id: number; name: string | null }) => string) | undefined,
): ReactNode {
  const Icon = icon ?? Package;
  const displayName = getName?.(entity);

  return (
    <div className="flex min-w-0 items-center gap-2">
      {entity.photo_url ? (
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded border border-border bg-muted">
          <Image
            src={entity.photo_url}
            alt={displayName ?? ""}
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

  if ("room" in entity && entity.room != null && entity.room.id != null) {
    const room = entity.room;
    return (
      <Link
        href={`/rooms/${room.id}`}
        className="flex items-center gap-2 text-sm transition-colors hover:text-primary"
      >
        <DoorOpen className="h-4 w-4 flex-shrink-0 text-primary" />
        <span>{room.name ?? "—"}</span>
      </Link>
    );
  }

  if ("room" in entity) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  return null;
}

function renderMovedAtCell(entity: ListEntity): ReactNode {
  const movedAt = entity.last_location?.moved_at;
  if (!movedAt) return null;
  return <span className="text-xs text-muted-foreground">{formatRuDate(movedAt)}</span>;
}

function renderCountsCell(entity: ListEntity, counts: CountsConfig | undefined): ReactNode {
  return renderCountLinks(entity, counts);
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
      return renderNameCell(entity, editHref, icon, getName);

    case "room":
      return renderRoomCell(entity, roomLabel);

    case "movedAt":
      return renderMovedAtCell(entity);

    case "counts":
      return renderCountsCell(entity, counts);

    case "actions":
      return <EntityActions actions={actions} />;

    default:
      return null;
  }
}

function getResponsiveHiddenClass(column: ListColumnConfig): string {
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
    Boolean(target.closest(INTERACTIVE_SELECTOR)) ||
    Boolean(target.closest(OVERLAY_SELECTOR));

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    pointerStartedOnRowRef.current = e.button === 0 && !isInteractiveTarget(target);
  };

  const handleRowClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const clickedInsideRow = e.currentTarget.contains(target as Node);
    const canNavigate =
      clickedInsideRow &&
      pointerStartedOnRowRef.current &&
      !isInteractiveTarget(target);
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
