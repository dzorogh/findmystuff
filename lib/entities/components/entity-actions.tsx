"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  ArrowRightLeft,
  Trash2,
  RotateCcw,
  Printer,
  Copy,
  MoreHorizontal,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ListActionsConfig, ListActionKey } from "@/lib/app/types/list-config";

interface ListActionItem {
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  destructive?: boolean;
  restore?: boolean;
  showAsIconOnMobile?: boolean;
  custom?: ReactNode;
}

export interface EntityActionsCallbacks {
  editHref?: string;
  moveAction?: ReactNode;
  onMove?: () => void;
  onPrintLabel?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
}

const ACTION_META: Record<
  ListActionKey,
  { label: string; icon: LucideIcon; showAsIconOnMobile: boolean }
> = {
  edit: { label: "Редактировать", icon: Pencil, showAsIconOnMobile: false },
  move: { label: "Переместить", icon: ArrowRightLeft, showAsIconOnMobile: true },
  printLabel: { label: "Печать этикетки", icon: Printer, showAsIconOnMobile: false },
  duplicate: { label: "Дублировать", icon: Copy, showAsIconOnMobile: false },
  delete: { label: "Удалить", icon: Trash2, showAsIconOnMobile: false },
};

const RESTORE_META = {
  label: "Восстановить",
  icon: RotateCcw,
  showAsIconOnMobile: true,
};

function buildActions(
  actionsConfig: ListActionsConfig,
  callbacks: EntityActionsCallbacks,
  isDeleted: boolean
): ListActionItem[] {
  if (isDeleted && actionsConfig.showRestoreWhenDeleted && callbacks.onRestore) {
    return [{ ...RESTORE_META, restore: true, onClick: callbacks.onRestore }];
  }
  const list: ListActionItem[] = [];
  for (const key of actionsConfig.actions) {
    const meta = ACTION_META[key];
    if (!meta) continue;
    if (key === "edit" && callbacks.editHref) {
      list.push({ ...meta, href: callbacks.editHref });
    } else if (key === "move") {
      if (callbacks.moveAction) {
        list.push({ ...meta, custom: callbacks.moveAction });
      } else if (callbacks.onMove) {
        list.push({ ...meta, onClick: callbacks.onMove });
      }
    } else if (key === "printLabel" && callbacks.onPrintLabel) {
      list.push({ ...meta, onClick: callbacks.onPrintLabel });
    } else if (key === "duplicate" && callbacks.onDuplicate) {
      list.push({ ...meta, onClick: callbacks.onDuplicate });
    } else if (key === "delete" && callbacks.onDelete) {
      list.push({ ...meta, destructive: true, onClick: callbacks.onDelete });
    }
  }
  return list;
}

interface EntityActionsProps {
  actionsConfig: ListActionsConfig;
  callbacks: EntityActionsCallbacks;
  isDeleted: boolean;
  disabled?: boolean;
  className?: string;
}

export function EntityActions({
  actionsConfig,
  callbacks,
  isDeleted,
  disabled = false,
  className,
}: EntityActionsProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const actions = buildActions(actionsConfig, callbacks, isDeleted);

  const renderLabel = (item: ListActionItem) => {
    const Icon = item.icon;
    return (
      <>
        <Icon className="h-4 w-4 shrink-0" />
        <span>{item.label}</span>
      </>
    );
  };

  const iconClass = (item: ListActionItem) =>
    cn(
      "h-8 w-8",
      item.destructive && "text-destructive hover:text-destructive",
      item.restore && "text-green-600 hover:text-green-700"
    );

  const withIcon = actions.filter((a) => a.showAsIconOnMobile);
  const inPopover = actions.filter((a) => !a.showAsIconOnMobile);

  if (actions.length === 0) return null;

  return (
    <div className={cn("flex items-center justify-end gap-1 sm:gap-2", className)}>
      <div className="hidden md:flex">
        {actions.map((item, index) => {
          const Icon = item.icon;
          if (item.custom) {
            return <span key={index}>{item.custom}</span>;
          }
          if (item.href) {
            const active = pathname.startsWith(item.href);
            return (
              <Button
                key={index}
                variant={active ? "secondary" : "ghost"}
                size="icon"
                className={iconClass(item)}
                title={item.label}
                disabled={disabled}
                asChild
              >
                <Link href={item.href}>
                  <Icon className="h-4 w-4" />
                </Link>
              </Button>
            );
          }
          return (
            <Button
              key={index}
              variant="ghost"
              size="icon"
              className={iconClass(item)}
              title={item.label}
              disabled={disabled}
              onClick={item.onClick}
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}
      </div>

      <div className="flex md:hidden items-center justify-end gap-1">
        {withIcon.map((item, index) => {
          const Icon = item.icon;
          if (item.custom) {
            return <span key={index}>{item.custom}</span>;
          }
          return (
            <Button
              key={index}
              variant="ghost"
              size="icon"
              className={iconClass(item)}
              aria-label={item.label}
              disabled={disabled}
              onClick={item.onClick}
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}
        {inPopover.length > 0 && (
          <Popover open={mobileOpen} onOpenChange={setMobileOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Открыть меню действий"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-40 p-1">
              {inPopover.map((item, index) =>
                item.custom ? (
                  <div key={index} onClick={() => setMobileOpen(false)}>
                    {item.custom}
                  </div>
                ) : item.href ? (
                  <Button
                    key={index}
                    variant={
                      pathname.startsWith(item.href) ? "secondary" : "ghost"
                    }
                    size="sm"
                    className={cn(
                      "w-full justify-start gap-2",
                      item.restore && "text-green-600 hover:text-green-700"
                    )}
                    asChild
                  >
                    <Link href={item.href}>{renderLabel(item)}</Link>
                  </Button>
                ) : (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      item.onClick?.();
                      setMobileOpen(false);
                    }}
                    className={cn(
                      "w-full justify-start gap-2",
                      item.destructive &&
                        "text-destructive hover:text-destructive",
                      item.restore && "text-green-600 hover:text-green-700"
                    )}
                  >
                    {renderLabel(item)}
                  </Button>
                )
              )}
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}
