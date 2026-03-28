import type { ItemPhotoSearchResponse } from "@/types/api";

export interface ItemPhotoSearchParams {
  file: File;
  showDeleted?: boolean;
  entityTypeId?: number | null;
  locationType?: string | null;
  roomId?: number | null;
  placeId?: number | null;
  containerId?: number | null;
  furnitureId?: number | null;
  hasPhoto?: boolean | null;
}

function appendOptionalField(
  formData: FormData,
  key: string,
  value: string | number | boolean | null | undefined
) {
  if (value == null) return;
  formData.append(key, String(value));
}

export const itemPhotoSearchApiClient = {
  async search(params: ItemPhotoSearchParams): Promise<ItemPhotoSearchResponse> {
    const formData = new FormData();
    formData.append("file", params.file);
    appendOptionalField(formData, "showDeleted", params.showDeleted ?? false);
    appendOptionalField(formData, "entityTypeId", params.entityTypeId);
    appendOptionalField(formData, "locationType", params.locationType);
    appendOptionalField(formData, "roomId", params.roomId);
    appendOptionalField(formData, "placeId", params.placeId);
    appendOptionalField(formData, "containerId", params.containerId);
    appendOptionalField(formData, "furnitureId", params.furnitureId);
    appendOptionalField(formData, "hasPhoto", params.hasPhoto);

    const response = await fetch("/api/items/photo-search", {
      method: "POST",
      body: formData,
    });

    const data = (await response.json().catch(() => null)) as
      | ItemPhotoSearchResponse
      | { error?: string }
      | null;

    if (!response.ok) {
      throw new Error(data && "error" in data ? data.error || "Ошибка поиска по фото" : "Ошибка поиска по фото");
    }

    return {
      data: Array.isArray(data?.data) ? data.data : [],
      totalCount: typeof data?.totalCount === "number" ? data.totalCount : 0,
      noSimilarFound: Boolean(data?.noSimilarFound),
    };
  },
};
