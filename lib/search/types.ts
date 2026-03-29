import type { EntityTypeName } from "@/types/entity";

export type SearchMode = "text" | "image";
export type SearchScope = "global" | "items";
export type SearchMatchSource = "text" | "image" | "keyword" | "hybrid";
export type SearchBadgeVariant = "secondary" | "outline" | "default";

export interface SearchQueryInput {
  text?: string;
  image?: File | Blob;
  mode: SearchMode;
  scope: SearchScope;
}

export interface SearchLocationLine {
  key: "room" | "furniture" | "place" | "container";
  label: string;
  value: string;
}

export interface SearchBadge {
  label: string;
  variant?: SearchBadgeVariant;
}

export interface SearchHitMatch {
  score?: number | null;
  source?: SearchMatchSource | null;
}

export interface SearchHitPreview {
  imageUrl?: string | null;
}

export interface SearchHit {
  entityType: EntityTypeName;
  entityId: number;
  title: string;
  subtitle?: string | null;
  href: string;
  badges: SearchBadge[];
  locationLines: SearchLocationLine[];
  match?: SearchHitMatch | null;
  preview?: SearchHitPreview | null;
}

export interface SearchResponseMeta {
  mode: SearchMode;
  scope: SearchScope;
  query?: string | null;
  totalCount: number;
  noMatches: boolean;
}

export interface SearchResponse {
  data: SearchHit[];
  totalCount: number;
  meta: SearchResponseMeta;
}

export interface ItemSearchProjection {
  id: number;
  name: string | null;
  photo_url: string | null;
  item_type_name: string | null;
  room_name: string | null;
  furniture_name: string | null;
  place_name: string | null;
  container_name: string | null;
  search_match?: {
    similarity: number;
    source: SearchMatchSource;
  } | null;
}

export interface ContainerSearchProjection {
  id: number;
  name: string | null;
  photo_url: string | null;
  container_type_name: string | null;
  room_name: string | null;
  furniture_name: string | null;
  place_name: string | null;
  container_name: string | null;
  search_match?: {
    similarity: number;
    source: SearchMatchSource;
  } | null;
}

export interface EntitySearchRpcRow {
  entity_type: "item" | "container";
  entity_id: number;
  similarity: number | null;
  match_source: SearchMatchSource | null;
  total_count?: number | null;
}
