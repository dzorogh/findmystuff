import { resolveActions } from "@/lib/entities/resolve-actions";
import { Pencil, RotateCcw, Trash2 } from "lucide-react";

describe("resolveActions", () => {
  const baseEntity = { id: 1, name: "Test", deleted_at: null };
  const baseCtx = {
    refreshList: jest.fn(),
    handleDelete: jest.fn(),
    handleRestore: jest.fn(),
  };

  it("возвращает whenActive для активной сущности", () => {
    const actions = resolveActions(
      {
        whenActive: [
          {
            key: "edit",
            label: "Редактировать",
            icon: Pencil,
            getHref: (e) => `/items/${e.id}`,
          },
        ],
      },
      baseEntity,
      baseCtx
    );
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ key: "edit", label: "Редактировать" });
    expect("href" in actions[0] && actions[0].href).toBe("/items/1");
  });

  it("возвращает whenDeleted для удалённой сущности", () => {
    const deletedEntity = { ...baseEntity, deleted_at: "2024-01-01" };
    const actions = resolveActions(
      {
        whenActive: [{ key: "edit", label: "Edit", icon: Pencil, getHref: () => "/edit" }],
        whenDeleted: [
          {
            key: "restore",
            label: "Восстановить",
            icon: RotateCcw,
            getOnClick: (e, ctx) => () => ctx.handleRestore?.(e.id),
          },
        ],
      },
      deletedEntity,
      baseCtx
    );
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ key: "restore", label: "Восстановить" });
    expect("onClick" in actions[0]).toBe(true);
  });

  it("возвращает пустой массив для удалённой сущности без whenDeleted", () => {
    const deletedEntity = { ...baseEntity, deleted_at: "2024-01-01" };
    const actions = resolveActions(
      { whenActive: [{ key: "edit", label: "Edit", icon: Pencil, getHref: () => "/edit" }] },
      deletedEntity,
      baseCtx
    );
    expect(actions).toEqual([]);
  });

  it("резолвит Form+getFormProps", () => {
    const MockForm = () => null;
    const actions = resolveActions(
      {
        whenActive: [
          {
            key: "move",
            label: "Переместить",
            icon: Pencil,
            Form: MockForm as never,
            getFormProps: (e, ctx) => ({
              entityId: e.id,
              onSuccess: ctx.refreshList,
            }),
          },
        ],
      },
      baseEntity,
      baseCtx
    );
    expect(actions).toHaveLength(1);
    const action = actions[0];
    expect("Form" in action).toBe(true);
    expect("formProps" in action).toBe(true);
    if ("Form" in action && "formProps" in action) {
      expect(action.formProps).toEqual({ entityId: 1, onSuccess: baseCtx.refreshList });
    }
  });

  it("резолвит getOnClick в onClick", () => {
    const handleDelete = jest.fn();
    const actions = resolveActions(
      {
        whenActive: [
          {
            key: "delete",
            label: "Удалить",
            icon: Trash2,
            variant: "destructive",
            getOnClick: (e, ctx) => () => ctx.handleDelete?.(e.id),
          },
        ],
      },
      baseEntity,
      { ...baseCtx, handleDelete }
    );
    expect(actions).toHaveLength(1);
    const action = actions[0];
    expect("onClick" in action).toBe(true);
    if ("onClick" in action) {
      action.onClick();
      expect(handleDelete).toHaveBeenCalledWith(1);
    }
  });
});
