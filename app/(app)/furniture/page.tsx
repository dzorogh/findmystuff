"use client";

import { Suspense } from "react";
import { ListPageContent } from "@/components/lists/list-page-content";
import { useListPage } from "@/lib/app/hooks/use-list-page";
import { furnitureEntityConfig } from "@/lib/entities/furniture/entity-config";

function FurniturePageContent() {
  const listPage = useListPage(furnitureEntityConfig);
  const getRowActions = furnitureEntityConfig.useActions({ refreshList: listPage.refreshList });

  return <ListPageContent listPage={listPage} getRowActions={getRowActions} />;
}

const FurniturePage = () => (
  <Suspense fallback={null}>
    <FurniturePageContent />
  </Suspense>
);

export default FurniturePage;
