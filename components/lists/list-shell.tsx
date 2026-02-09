"use client";

import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ListErrorCard } from "@/components/lists/list-error-card";
import { ListEmptyState } from "@/components/lists/list-empty-state";

interface ListShellProps {
  error: string | null;
  isEmpty: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  children: ReactNode;
}

export function ListShell({
  error,
  isEmpty,
  emptyTitle = "Ничего не найдено",
  emptyDescription,
  emptyIcon = Inbox,
  children,
}: ListShellProps) {
  if (error) {
    return <ListErrorCard message={error} />;
  }

  if (isEmpty) {
    return (
      <ListEmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return <>{children}</>;
}
