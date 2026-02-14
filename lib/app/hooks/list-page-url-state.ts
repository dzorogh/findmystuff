"use client";

import {
  parseAsString,
  parseAsInteger,
  parseAsBoolean,
  parseAsStringLiteral,
  createParser,
} from "nuqs";
import type { Filters } from "@/lib/app/types/entity-config";

/** Parser for yesNoAll filter: true | false | null, stored as "true" | "false" in URL. */
const yesNoAllParser = createParser<boolean | null>({
  parse: (v) => (!v ? null : v === "true" ? true : v === "false" ? false : null),
  serialize: (v) => (v === true ? "true" : v === false ? "false" : ""),
});

/** URL param parsers for list pages. Shared param names across entities. */
export const listPageUrlParsers = {
  search: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  sortBy: parseAsStringLiteral(["name", "created_at"] as const).withDefault("created_at"),
  sortDirection: parseAsStringLiteral(["asc", "desc"] as const).withDefault("desc"),
  showDeleted: parseAsBoolean.withDefault(false),
  buildingId: parseAsInteger,
  roomId: parseAsInteger,
  furnitureId: parseAsInteger,
  placeId: parseAsInteger,
  containerId: parseAsInteger,
  entityTypeId: parseAsInteger,
  locationType: parseAsStringLiteral(["all", "room", "place", "container"] as const),
  hasPhoto: yesNoAllParser,
  hasItems: yesNoAllParser,
  hasContainers: yesNoAllParser,
  hasPlaces: yesNoAllParser,
} as const;

/** Build filters from URL state, only including keys from initialFilters. */
export function urlStateToFilters(
  urlState: Partial<ListPageUrlState>,
  initialFilters: Filters
): Filters {
  const result = { ...initialFilters } as Record<string, unknown>;
  const keys = Object.keys(initialFilters) as string[];
  for (const key of keys) {
    if (key in listPageUrlParsers && key in urlState) {
      result[key] = (urlState as Record<string, unknown>)[key];
    }
  }
  return result as Filters;
}

type ListPageUrlState = {
  search: string;
  page: number;
  sortBy: "name" | "created_at";
  sortDirection: "asc" | "desc";
  showDeleted: boolean;
  buildingId: number | null;
  roomId: number | null;
  furnitureId: number | null;
  placeId: number | null;
  containerId: number | null;
  entityTypeId: number | null;
  locationType: "all" | "room" | "place" | "container" | null;
  hasPhoto: boolean | null;
  hasItems: boolean | null;
  hasContainers: boolean | null;
  hasPlaces: boolean | null;
};

/** Extract URL-updatable values from filters (only keys that exist in url parsers). */
export function filtersToUrlState(
  filters: Filters,
  initialFilters: Filters
): Partial<ListPageUrlState> {
  const result: Record<string, unknown> = {};
  const keys = Object.keys(initialFilters) as string[];
  for (const key of keys) {
    if (key in listPageUrlParsers && key in filters) {
      result[key] = (filters as Record<string, unknown>)[key];
    }
  }
  return result as Partial<ListPageUrlState>;
}
