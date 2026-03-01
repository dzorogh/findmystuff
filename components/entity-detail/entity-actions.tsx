"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Action } from "@/types/entity";

interface EntityActionsItemProps {
  action: Action;
  mode: "button" | "dropdown";
}

function EntityActionsItem({ action, mode }: EntityActionsItemProps) {
  const [formOpen, setFormOpen] = useState(false);
  const router = useRouter();
  const Icon = action.icon;
  const variant = action.variant ?? "ghost";

  const isFormAction = "Form" in action;
  const handleTrigger = (e?: MouseEvent) => {
    e?.stopPropagation();
    if ("href" in action) router.push(action.href);
    else if ("onClick" in action) action.onClick();
    else if (isFormAction) setFormOpen(true);
  };

  const content = (
    <>
      <Icon data-icon="inline-start" />
      {action.label}
    </>
  );

  const triggerProps = {
    variant,
    title: action.label,
    "aria-label": action.label,
  };

  if (mode === "button") {
    const buttonProps =
      "href" in action
        ? {
          render: <Link href={action.href} onClick={(e: MouseEvent) => e.stopPropagation()} />,
          nativeButton: false,
        }
        : { onClick: handleTrigger };

    const buttonEl = (
      <Button key={action.key} size="icon" {...triggerProps} {...buttonProps}>
        <Icon data-icon="inline-start" />
      </Button>
    );

    const formEl =
      isFormAction && (
        <action.Form
          {...(action.formProps as object)}
          open={formOpen}
          onOpenChange={setFormOpen}
        />
      );

    return formEl ? <span className="inline-flex">{buttonEl}{formEl}</span> : buttonEl;
  }

  return (
    <>
      <DropdownMenuItem
        key={action.key}
        variant={action.variant === "destructive" ? "destructive" : undefined}
        onClick={handleTrigger}
      >
        {content}
      </DropdownMenuItem>
      {isFormAction && (
        <action.Form
          {...(action.formProps as object)}
          open={formOpen}
          onOpenChange={setFormOpen}
        />
      )}
    </>
  );
}

export interface EntityActionsProps {
  actions: Action[];
  className?: string;
}

export function EntityActions({ actions, className }: EntityActionsProps) {
  if (actions.length === 0) return null;

  return (
    <div
      className={cn("flex items-center justify-end gap-2", className)}
    >
      {/* Десктоп: кнопки */}
      <div className="hidden sm:flex items-center gap-2">
        {actions.map((action) => (
          <EntityActionsItem key={action.key} action={action} mode="button" />
        ))}
      </div>
      {/* Мобильный: dropdown */}
      <div className="flex sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label="Действия"
                onClick={(e: MouseEvent) => e.stopPropagation()}
              >
                <MoreVertical data-icon="inline-start" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-48">
            {actions.map((action) => (
              <EntityActionsItem key={action.key} action={action} mode="dropdown" />
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
