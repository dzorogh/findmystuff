"use client";

import { useState } from "react";
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
import type { Action } from "@/lib/app/types/entity-action";

interface EntityActionsItemProps {
  action: Action;
  mode: "button" | "dropdown";
}

function EntityActionsItem({ action, mode }: EntityActionsItemProps) {
  const [formOpen, setFormOpen] = useState(false);
  const router = useRouter();
  const Icon = action.icon;
  const variant = action.variant ?? "ghost";

  const handleClick = () => {
    if ("href" in action) {
      router.push(action.href);
    } else if ("onClick" in action) {
      action.onClick();
    } else if ("Form" in action) {
      setFormOpen(true);
    }
  };

  const content = (
    <>
      <Icon data-icon="inline-start" />
      {action.label}
    </>
  );

  if ("Form" in action) {
    const { Form, formProps } = action;
    const formPropsWithState = { ...formProps, open: formOpen, onOpenChange: setFormOpen };
    const FormWithState = <Form {...(formPropsWithState as object)} />;

    if (mode === "button") {
      return (
        <span className="inline-flex">
          <Button
            variant={variant}
            size="icon"
            title={action.label}
            aria-label={action.label}
            onClick={() => setFormOpen(true)}
          >
            <Icon data-icon="inline-start" />
          </Button>
          {FormWithState}
        </span>
      );
    }

    return (
      <>
        <DropdownMenuItem onClick={() => setFormOpen(true)}>
          {content}
        </DropdownMenuItem>
        {FormWithState}
      </>
    );
  }

  if (mode === "button") {
    if ("href" in action) {
      return (
        <Button
          key={action.key}
          variant={variant}
          size="icon"
          title={action.label}
          aria-label={action.label}
          onClickCapture={(e) => e.stopPropagation()}
          render={<Link href={action.href} />}
          nativeButton={false}
        >
          <Icon data-icon="inline-start" />
        </Button>
      );
    }
    return (
      <Button
        key={action.key}
        variant={variant}
        size="icon"
        title={action.label}
        aria-label={action.label}
        onClick={handleClick}
      >
        <Icon data-icon="inline-start" />
      </Button>
    );
  }

  return (
    <DropdownMenuItem
      key={action.key}
      variant={"destructive" in action && action.variant === "destructive" ? "destructive" : undefined}
      onClick={handleClick}
    >
      {content}
    </DropdownMenuItem>
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
      onClick={(e) => e.stopPropagation()}
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
              <Button variant="ghost" size="icon" aria-label="Действия">
                <MoreVertical data-icon="inline-start" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            {actions.map((action) => (
              <EntityActionsItem key={action.key} action={action} mode="dropdown" />
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
