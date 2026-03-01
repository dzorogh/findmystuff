"use client";

import {
  TableBody,
} from "@/components/ui/table";
import { EntityRowSkeleton } from "@/components/lists/entity-row-skeleton";
import type { ListColumnConfig } from "@/types/entity";

const DEFAULT_ROW_COUNT = 6;

interface EntityListSkeletonProps {
  columnsConfig: ListColumnConfig[];
  rowCount?: number;
}

export function EntityListSkeleton({
  columnsConfig,
  rowCount = DEFAULT_ROW_COUNT,
}: EntityListSkeletonProps) {
  return (
    <TableBody>
      {Array.from({ length: rowCount }).map((_, i) => (
        <EntityRowSkeleton key={i} columnsConfig={columnsConfig} />
      ))}
    </TableBody>
  );
}
