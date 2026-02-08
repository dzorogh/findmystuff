"use client";

import { Suspense } from "react";
import { ListPageContent } from "@/components/lists/list-page-content";
import { useItemsListPageBehavior } from "@/lib/entities/items/use-items-list-page-behavior";
import { ITEMS_LIST_CONFIG } from "@/lib/entities/items/list-config";
import { useListPage } from "@/lib/app/hooks/use-list-page";
import { useItemsListRowActions } from "@/lib/entities/items/use-items-list-row-actions";

export default function ItemsPage() {
  const listConfig = { ...ITEMS_LIST_CONFIG, ...useItemsListPageBehavior() };
  const listPage = useListPage(listConfig);
  const getRowActions = useItemsListRowActions({ refreshList: listPage.refreshList });

  return (
    <Suspense fallback={null}>
      <ListPageContent listPage={listPage} getRowActions={getRowActions} />
    </Suspense>
  );
}
