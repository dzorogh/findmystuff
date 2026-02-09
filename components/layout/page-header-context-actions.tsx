"use client";

import { useCurrentPage } from "@/lib/app/contexts/current-page-context";

export function PageHeaderContextActions() {
  const { entityActions } = useCurrentPage();
  return entityActions;
}
