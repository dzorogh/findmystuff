import type { SortBy, SortDirection } from "@/lib/shared/api/list-params";

export type EntitySortBy = SortBy;
export type EntitySortDirection = SortDirection;
export type EntitySortOption = "created_desc" | "created_asc" | "name_asc" | "name_desc";

export const DEFAULT_ENTITY_SORT: EntitySortOption = "created_desc";

export const ENTITY_SORT_OPTIONS: Array<{
  value: EntitySortOption;
  label: string;
  sortBy: EntitySortBy;
  direction: EntitySortDirection;
}> = [
  { value: "created_desc", label: "Сначала новые", sortBy: "created_at", direction: "desc" },
  { value: "created_asc", label: "Сначала старые", sortBy: "created_at", direction: "asc" },
  { value: "name_asc", label: "По названию А-Я", sortBy: "name", direction: "asc" },
  { value: "name_desc", label: "По названию Я-А", sortBy: "name", direction: "desc" },
];

export const getEntitySortParams = (value: EntitySortOption) => {
  const match = ENTITY_SORT_OPTIONS.find((option) => option.value === value);
  return match
    ? { sortBy: match.sortBy, sortDirection: match.direction }
    : { sortBy: "created_at" as const, sortDirection: "desc" as const };
};

const collator = new Intl.Collator("ru", { numeric: true, sensitivity: "base" });

export const sortEntities = <T extends { name?: string | null; created_at?: string | null }>(
  rows: T[],
  sort: EntitySortOption
) => {
  const { sortBy, sortDirection } = getEntitySortParams(sort);
  const direction = sortDirection === "asc" ? 1 : -1;

  const compareName = (a: T, b: T) => {
    const aName = (a.name ?? "").trim();
    const bName = (b.name ?? "").trim();
    if (!aName && !bName) return 0;
    if (!aName) return 1;
    if (!bName) return -1;
    return collator.compare(aName, bName);
  };

  const compareCreated = (a: T, b: T) => {
    const aTime = a.created_at ? Date.parse(a.created_at) : 0;
    const bTime = b.created_at ? Date.parse(b.created_at) : 0;
    return aTime - bTime;
  };

  return [...rows].sort((a, b) => {
    const primary = sortBy === "name" ? compareName(a, b) : compareCreated(a, b);
    if (primary !== 0) return primary * direction;

    if (sortBy === "name") {
      const created = compareCreated(a, b);
      return created !== 0 ? created * -1 : 0;
    }

    const name = compareName(a, b);
    return name !== 0 ? name : 0;
  });
};
