"use client";

import { Suspense } from "react";
import { ListPageContent } from "@/components/lists/list-page-content";
import { useListPage } from "@/lib/app/hooks/use-list-page";
import { buildingsEntityConfig } from "@/lib/entities/buildings/entity-config";

function BuildingsPageContent() {
  const listPage = useListPage(buildingsEntityConfig);
  const getRowActions = buildingsEntityConfig.useActions({ refreshList: listPage.refreshList });

  return <ListPageContent listPage={listPage} getRowActions={getRowActions} />;
}

const BuildingsPage = () => (
  <Suspense fallback={null}>
    <BuildingsPageContent />
  </Suspense>
);

export default BuildingsPage;
