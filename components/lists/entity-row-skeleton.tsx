"use client";

import { TableRow, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { ListColumnConfig } from "@/types/entity";

interface EntityRowSkeletonProps {
  columnsConfig: ListColumnConfig[];
}

export function EntityRowSkeleton({ columnsConfig }: EntityRowSkeletonProps) {
  return (
    <TableRow>
      {columnsConfig.map((col) => (
        <TableCell
          key={col.key}
          className={`${col.width ?? ""} ${col.hideOnMobile ? "hidden sm:table-cell" : ""}`}
        >
          <Skeleton className="h-6 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );
}
