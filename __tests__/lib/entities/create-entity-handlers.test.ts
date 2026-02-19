import { createEntityListHandlers } from "@/lib/entities/create-entity-handlers";
import { softDeleteApi } from "@/lib/shared/api/soft-delete";
import { duplicateEntityApi } from "@/lib/shared/api/duplicate-entity";
import { toast } from "sonner";

jest.mock("@/lib/shared/api/soft-delete");
jest.mock("@/lib/shared/api/duplicate-entity");
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

describe("createEntityListHandlers", () => {
  const mockRefreshList = jest.fn();
  const labels = {
    singular: "Вещь",
    plural: "Вещи",
    results: { one: "вещь", few: "вещи", many: "вещей" },
    moveTitle: "Move",
    moveSuccess: () => "",
    moveError: "",
    deleteConfirm: "Удалить?",
    deleteSuccess: "Удалено",
    restoreSuccess: "Восстановлено",
    duplicateSuccess: "Дублировано",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRefreshList.mockClear();
    (global as { confirm?: (msg: string) => boolean }).confirm = () => true;
  });

  it("handleDelete вызывает softDelete и refreshList", async () => {
    (softDeleteApi.softDelete as jest.Mock).mockResolvedValue({});
    const { handleDelete } = createEntityListHandlers("items", labels, mockRefreshList);

    await handleDelete(5);

    expect(softDeleteApi.softDelete).toHaveBeenCalledWith("items", 5);
    expect(toast.success).toHaveBeenCalledWith("Удалено");
    expect(mockRefreshList).toHaveBeenCalled();
  });

  it("handleRestore вызывает restoreDeleted", async () => {
    (softDeleteApi.restoreDeleted as jest.Mock).mockResolvedValue({});
    const { handleRestore } = createEntityListHandlers("items", labels, mockRefreshList);

    await handleRestore(3);

    expect(softDeleteApi.restoreDeleted).toHaveBeenCalledWith("items", 3);
    expect(toast.success).toHaveBeenCalledWith("Восстановлено");
    expect(mockRefreshList).toHaveBeenCalled();
  });

  it("handleDuplicate вызывает duplicate", async () => {
    (duplicateEntityApi.duplicate as jest.Mock).mockResolvedValue({});
    const { handleDuplicate } = createEntityListHandlers("items", labels, mockRefreshList);

    await handleDuplicate(7);

    expect(duplicateEntityApi.duplicate).toHaveBeenCalledWith("items", 7);
    expect(toast.success).toHaveBeenCalledWith("Дублировано");
    expect(mockRefreshList).toHaveBeenCalled();
  });

  it("при отказе confirm handleDelete не вызывает API", async () => {
    (global as { confirm?: (msg: string) => boolean }).confirm = () => false;
    (softDeleteApi.softDelete as jest.Mock).mockResolvedValue({});
    const { handleDelete } = createEntityListHandlers("items", labels, mockRefreshList);

    await handleDelete(1);

    expect(softDeleteApi.softDelete).not.toHaveBeenCalled();
  });

  it("при ошибке API показывает toast.error", async () => {
    (softDeleteApi.restoreDeleted as jest.Mock).mockResolvedValue({ error: "Ошибка" });
    const { handleRestore } = createEntityListHandlers("items", labels, mockRefreshList);

    await handleRestore(1);

    expect(toast.error).toHaveBeenCalled();
    expect(mockRefreshList).not.toHaveBeenCalled();
  });
});
