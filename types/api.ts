/**
 * API, list params, HTTP/client, cache and seed types.
 * Detail payloads сущностей (PlaceDetailData, ContainerDetailData, RpcPlaceRow и т.д.) — в types/entity.ts.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// --- Sort / list params ---

export type SortBy = "name" | "created_at";
export type SortDirection = "asc" | "desc";

// --- HTTP client ---

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  totalCount?: number;
}

export interface RequestOptions extends RequestInit {
  tenantId?: number | null;
}

// --- API response types ---

export interface BarcodeLookupResponse {
  productName: string | null;
  error?: string;
}

export interface RecognizeItemPhotoResponse {
  itemName: string | null;
  error?: string;
}

export interface ItemMoneyFields {
  price_amount: number | null;
  price_currency: string | null;
  current_value_amount: number | null;
  current_value_currency: string | null;
}

export interface ValidateItemMoneyInput {
  price_amount: unknown;
  price_currency: unknown;
  current_value_amount: unknown;
  current_value_currency: unknown;
}

export interface EntityTypeRelation {
  name?: string | null;
}

export type PlaceLikeUpdateBody = {
  name?: string | null;
  entity_type_id?: number | null;
  photo_url?: string | null;
};

export type PlaceLikeUpdateData = {
  name?: string | null;
  entity_type_id?: number | null;
  photo_url?: string | null;
};

export type InsertEntityWithTransitionParams<_T = unknown> = {
  supabase: SupabaseClient;
  table: "places" | "containers" | "items";
  insertData: Record<string, unknown>;
  transitionPayload: {
    destination_type: string;
    destination_id: number;
    tenant_id: number;
  } | null;
};

export type InsertEntityWithTransitionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export type UpdatePasswordResult = { success?: boolean; error?: string };

export type { TransitionBody } from "@/lib/shared/api/schemas/transition-body";

// --- Places list (params для getPlacesList) ---

export type GetPlacesListParams = {
  query: string | null;
  showDeleted: boolean;
  sortBy: SortBy;
  sortDirection: SortDirection;
  entityTypeId: number | null;
  roomId: number | null;
  furnitureId: number | null;
  tenantId: number;
};

// --- Cache ---

export interface CacheEntry<T> {
  data: T[];
  error: Error | null;
}

export interface SimpleListCache<T> {
  get(key: string): CacheEntry<T> | undefined;
  subscribe(key: string, notify: (data: T[], error: Error | null) => void): () => void;
  load(
    key: string,
    fetch: () => Promise<{ data: T[] | null; error?: string }>
  ): Promise<void>;
  invalidate(key: string): void;
}
