"use client";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityRowSkeleton } from "@/components/lists/entity-row-skeleton";
import type { ListColumnConfig } from "@/lib/app/types/list-config";

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
