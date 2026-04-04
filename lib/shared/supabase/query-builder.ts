export const applyDeletedFilter = <T extends { is: (column: string, value: null) => T; not: (column: string, operator: string, value: null) => T }>(
  queryBuilder: T,
  showDeleted: boolean
): T => {
  if (!showDeleted) {
    return queryBuilder.is("deleted_at", null);
  } else {
    return queryBuilder.not("deleted_at", "is", null);
  }
};

export const applyNameSearch = <T extends { ilike: (column: string, pattern: string) => T; or: (conditions: string) => T }>(
  queryBuilder: T,
  query: string | undefined,
  searchFields: string[] = ["name"]
): T => {
  if (!query || !query.trim()) {
    return queryBuilder;
  }

  const searchTerm = query.trim();

  if (searchFields.length === 1) {
    return queryBuilder.ilike(searchFields[0], `%${searchTerm}%`);
  }

  const orConditions = searchFields
    .map((field) => `${field}.ilike.%${searchTerm}%`)
    .join(",");
  return queryBuilder.or(orConditions);
};
