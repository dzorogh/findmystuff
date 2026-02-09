export type SortBy = "name" | "created_at";
export type SortDirection = "asc" | "desc";

export const normalizeSortParams = (
  sortByParam?: string | null,
  sortDirectionParam?: string | null
): { sortBy: SortBy; sortDirection: SortDirection } => {
  const sortBy: SortBy = sortByParam === "name" ? "name" : "created_at";
  const sortDirection: SortDirection = sortDirectionParam === "asc" ? "asc" : "desc";
  return { sortBy, sortDirection };
};

export const appendSortParams = (
  searchParams: URLSearchParams,
  sortBy?: SortBy,
  sortDirection?: SortDirection
) => {
  if (sortBy) searchParams.set("sortBy", sortBy);
  if (sortDirection) searchParams.set("sortDirection", sortDirection);
};
