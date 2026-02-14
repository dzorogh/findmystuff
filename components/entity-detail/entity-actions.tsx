"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import MoveEntityForm, {
  type MoveEntityFormProps,
} from "@/components/forms/move-entity-form";
import MoveRoomForm, {
  type MoveRoomFormProps,
} from "@/components/forms/move-room-form";
import MovePlaceForm, {
  type MovePlaceFormProps,
} from "@/components/forms/move-place-form";
import {
  Pencil,
  ArrowRightLeft,
  Trash2,
  RotateCcw,
  Printer,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ActionsConfig, ActionKey } from "@/lib/app/types/entity-config";

interface ActionMeta {
  label: string;
  icon: LucideIcon;
}

interface ListActionItem {
  key: ActionKey | "restore";
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  variant: "ghost" | "secondary" | "destructive" | "default";
  custom?: ReactNode;
}

export interface EntityActionsCallbacks {
  editHref?: string;
  moveForm?: Omit<MoveEntityFormProps, "trigger">;
  moveRoomForm?: Omit<MoveRoomFormProps, "trigger">;
  movePlaceForm?: Omit<MovePlaceFormProps, "trigger">;
  onMove?: () => void;
  onPrintLabel?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
}

const ACTION_META: Record<ActionKey, ActionMeta> = {
  edit: { label: "Редактировать", icon: Pencil },
  move: { label: "Переместить", icon: ArrowRightLeft },
  printLabel: { label: "Печать этикетки", icon: Printer },
  duplicate: { label: "Дублировать", icon: Copy },
  delete: { label: "Удалить", icon: Trash2 },
};

function buildActions(
  actions: ActionsConfig,
  callbacks: EntityActionsCallbacks,
  isDeleted: boolean,
  buttonVariant?: "ghost" | "default"
): ListActionItem[] {
  if (isDeleted && actions.showRestoreWhenDeleted && callbacks.onRestore) {
    return [{
      key: "restore",
      label: "Восстановить",
      icon: RotateCcw,
      variant: "ghost",
      onClick: callbacks.onRestore,
    }];
  }

  const list: ListActionItem[] = [];
  for (const key of actions.actions) {
    const meta = ACTION_META[key];
    const base: ListActionItem = { key, ...meta, variant: "ghost" };

    switch (key) {
      case "edit":
        if (callbacks.editHref) list.push({ ...base, href: callbacks.editHref });
        break;
      case "move":
        if (callbacks.movePlaceForm) {
          list.push({
            ...base,
            custom: (
              <MovePlaceForm
                {...callbacks.movePlaceForm}
                trigger={
                  <Button variant="ghost" size="icon" aria-label={meta.label}>
                    <ArrowRightLeft data-icon="inline-start" />
                  </Button>
                }
              />
            ),
          });
        } else if (callbacks.moveRoomForm) {
          list.push({
            ...base,
            custom: (
              <MoveRoomForm
                {...callbacks.moveRoomForm}
                trigger={
                  <Button variant="ghost" size="icon" aria-label={meta.label}>
                    <ArrowRightLeft data-icon="inline-start" />
                  </Button>
                }
              />
            ),
          });
        } else if (callbacks.moveForm) {
          list.push({
            ...base,
            custom: (
              <MoveEntityForm
                {...callbacks.moveForm}
                trigger={
                  <Button variant="ghost" size="icon" aria-label={meta.label}>
                    <ArrowRightLeft data-icon="inline-start" />
                  </Button>
                }
              />
            ),
          });
        } else if (callbacks.onMove) {
          list.push({
            ...base,
            variant: (buttonVariant ?? "ghost") as ListActionItem["variant"],
            onClick: callbacks.onMove,
          });
        }
        break;
      case "printLabel":
        if (callbacks.onPrintLabel) {
          list.push({
            ...base,
            variant: (buttonVariant ?? "ghost") as ListActionItem["variant"],
            onClick: callbacks.onPrintLabel,
          });
        }
        break;
      case "duplicate":
        if (callbacks.onDuplicate) list.push({ ...base, onClick: callbacks.onDuplicate });
        break;
      case "delete":
        if (callbacks.onDelete) {
          list.push({ ...base, variant: "destructive", onClick: callbacks.onDelete });
        }
        break;
    }
  }

  return list;
}

interface EntityActionsProps {
  actions: ActionsConfig;
  callbacks: EntityActionsCallbacks;
  isDeleted: boolean;
  disabled?: boolean;
  className?: string;
  buttonVariant?: "ghost" | "default";
}

export function EntityActions({
  actions,
  callbacks,
  isDeleted,
  disabled = false,
  className,
  buttonVariant,
}: EntityActionsProps) {
  const actionItems = buildActions(actions, callbacks, isDeleted, buttonVariant);

  if (actionItems.length === 0) return null;

  return (
    <div className={cn("flex items-center justify-end gap-2", className)}>
      {actionItems.map((item) => {
        const Icon = item.icon;
        if (item.custom) {
          return <span key={item.key}>{item.custom}</span>;
        }

        return (
          <Button
            key={item.key}
            variant={item.variant}
            size="icon-sm"
            title={item.label}
            aria-label={item.label}
            disabled={disabled}
            onClick={item.href ? undefined : item.onClick}
            onClickCapture={item.href ? (e) => e.stopPropagation() : undefined}
            render={item.href ? <Link href={item.href} /> : undefined}
            nativeButton={item.href ? false : undefined}
          >
            <Icon data-icon="inline-start" />
          </Button>
        );
      })}
    </div>
  );
}
