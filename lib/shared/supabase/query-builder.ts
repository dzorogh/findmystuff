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
  const searchNumber = isNaN(Number(searchTerm)) ? null : Number(searchTerm);

  if (searchFields.length === 1) {
    return queryBuilder.ilike(searchFields[0], `%${searchTerm}%`);
  }

  if (searchNumber !== null) {
    const orConditions = searchFields
      .map((field) => `${field}.ilike.%${searchTerm}%`)
      .join(",");
    return queryBuilder.or(orConditions);
  } else {
    const orConditions = searchFields
      .map((field) => `${field}.ilike.%${searchTerm}%`)
      .join(",");
    return queryBuilder.or(orConditions);
  }
};
