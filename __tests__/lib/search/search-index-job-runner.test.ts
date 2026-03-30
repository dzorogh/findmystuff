import { runSearchIndexJob } from "@/lib/search/search-index-job-runner";

describe("runSearchIndexJob", () => {
  it("для item сначала обновляет item-only индекс, потом общий", async () => {
    const callOrder: string[] = [];

    await runSearchIndexJob(
      {
        tenantId: 1,
        entityType: "item",
        entityId: 31,
      },
      {
        syncItemSearchDocuments: jest.fn(async () => {
          callOrder.push("item");
        }),
        syncEntitySearchDocuments: jest.fn(async () => {
          callOrder.push("entity");
        }),
      }
    );

    expect(callOrder).toEqual(["item", "entity"]);
  });

  it("для container обновляет только общий индекс", async () => {
    const syncItemSearchDocuments = jest.fn();
    const syncEntitySearchDocuments = jest.fn();

    await runSearchIndexJob(
      {
        tenantId: 1,
        entityType: "container",
        entityId: 7,
      },
      {
        syncItemSearchDocuments,
        syncEntitySearchDocuments,
      }
    );

    expect(syncItemSearchDocuments).not.toHaveBeenCalled();
    expect(syncEntitySearchDocuments).toHaveBeenCalledWith("container", 7, 1);
  });
});
