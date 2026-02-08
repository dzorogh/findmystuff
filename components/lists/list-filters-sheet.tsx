"use client";

import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface ListFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  activeFiltersCount?: number;
  children: ReactNode;
}

export function ListFiltersSheet({
  open,
  onOpenChange,
  title = "Фильтры",
  activeFiltersCount = 0,
  children,
}: ListFiltersSheetProps) {
  const displayTitle =
    activeFiltersCount > 0 ? `${title} (${activeFiltersCount})` : title;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{displayTitle}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-2">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
