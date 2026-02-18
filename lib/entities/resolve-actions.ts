import type { ActionsConfig, EntityDisplay } from "@/lib/app/types/entity-config";
import type { Action, ActionConfig, ActionsContext } from "@/lib/app/types/entity-action";

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

  if ("getHref" in config) {
    return { ...base, href: config.getHref(entity) };
  }
  if ("getOnClick" in config) {
    return { ...base, onClick: config.getOnClick(entity, ctx) };
  }
  if ("Form" in config && "getFormProps" in config) {
    return {
      ...base,
      Form: config.Form,
      formProps: config.getFormProps(entity, ctx),
    };
  }

  throw new Error(`Invalid ActionConfig: missing getHref, getOnClick, or Form+getFormProps`);
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
