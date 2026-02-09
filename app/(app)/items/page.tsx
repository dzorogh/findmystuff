"use client";

import { Suspense } from "react";
import { ListPageContent } from "@/components/lists/list-page-content";
import { useListPage } from "@/lib/app/hooks/use-list-page";
import { itemsEntityConfig } from "@/lib/entities/items/entity-config";

export default function ItemsPage() {
  const listPage = useListPage(itemsEntityConfig);
  const getRowActions = itemsEntityConfig.useActions({ refreshList: listPage.refreshList });

  return (
    <Suspense fallback={null}>
      <ListPageContent listPage={listPage} getRowActions={getRowActions} />
    </Suspense>
  );
}
