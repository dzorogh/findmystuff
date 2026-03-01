import type { ComponentType } from "react";
import type {
  Action,
  ActionConfig,
  ActionsConfig,
  ActionsContext,
  EntityDisplay,
} from "@/types/entity";

type ActionConfigVariant = "href" | "onClick" | "form";

function getActionVariant(config: ActionConfig): ActionConfigVariant {
  if ("getHref" in config) return "href";
  if ("getOnClick" in config) return "onClick";
  if ("Form" in config && "getFormProps" in config) return "form";
  throw new Error(`Invalid ActionConfig: missing getHref, getOnClick, or Form+getFormProps`);
}

function resolveOne(
  config: ActionConfig,
  entity: EntityDisplay,
  ctx: ActionsContext
): Action {
  const base = {
    key: config.key,
    label: config.label,
    icon: config.icon,
    variant: config.variant ?? "ghost",
  };

  const variant = getActionVariant(config);
  switch (variant) {
    case "href":
      return { ...base, href: (config as ActionConfig & { getHref: (e: EntityDisplay) => string }).getHref(entity) };
    case "onClick":
      return { ...base, onClick: (config as ActionConfig & { getOnClick: (e: EntityDisplay, c: ActionsContext) => () => void }).getOnClick(entity, ctx) };
    case "form":
      return {
        ...base,
        Form: (config as ActionConfig & { Form: ComponentType<Record<string, unknown>>; getFormProps: (e: EntityDisplay, c: ActionsContext) => Record<string, unknown> }).Form,
        formProps: (config as ActionConfig & { getFormProps: (e: EntityDisplay, c: ActionsContext) => Record<string, unknown> }).getFormProps(entity, ctx),
      };
  }
}

export function resolveActions(
  actions: ActionsConfig,
  entity: EntityDisplay,
  ctx: ActionsContext
): Action[] {
  const configs =
    entity.deleted_at && actions.whenDeleted?.length
      ? actions.whenDeleted
      : entity.deleted_at
        ? []
        : actions.whenActive;

  return configs.map((ac) => resolveOne(ac, entity, ctx));
}
