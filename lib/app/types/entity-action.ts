import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

export interface EntityLike {
  id: number;
  name: string | null;
  deleted_at?: string | null;
}

export type ActionKey =
  | "edit"
  | "move"
  | "printLabel"
  | "duplicate"
  | "delete"
  | "restore";

export type ActionVariant = "ghost" | "secondary" | "destructive" | "default";

export interface ActionBase {
  key: ActionKey;
  label: string;
  icon: LucideIcon;
  variant?: ActionVariant;
}

export type Action =
  | (ActionBase & { href: string })
  | (ActionBase & { onClick: () => void })
  | (ActionBase & { Form: ComponentType<Record<string, unknown>>; formProps: Record<string, unknown> });

export interface ActionsContext {
  refreshList: () => void;
  basePath?: string;
  /** Для items и др.: печать этикетки. name может быть undefined. */
  printLabel?: (id: number, name?: string | null) => void | Promise<void>;
  handleDelete?: (id: number) => void;
  handleDuplicate?: (id: number) => void;
  handleRestore?: (id: number) => void;
}

export type ActionConfig =
  | (ActionBase & { getHref: (entity: EntityLike) => string })
  | (ActionBase & { getOnClick: (entity: EntityLike, ctx: ActionsContext) => () => void })
  | (ActionBase & {
      Form: ComponentType<Record<string, unknown>>;
      getFormProps: (entity: EntityLike, ctx: ActionsContext) => Record<string, unknown>;
    });
