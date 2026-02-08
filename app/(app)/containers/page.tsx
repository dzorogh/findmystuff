"use client";

import { Suspense } from "react";
import { ListPageContent } from "@/components/lists/list-page-content";
import { useListPage } from "@/lib/app/hooks/use-list-page";
import { containersEntityConfig } from "@/lib/entities/containers/entity-config";

function ContainersPageContent() {
  const listPage = useListPage(containersEntityConfig);
  const getRowActions = containersEntityConfig.useActions({ refreshList: listPage.refreshList });

  return <ListPageContent listPage={listPage} getRowActions={getRowActions} />;
}

const ContainersPage = () => (
  <Suspense fallback={null}>
    <ContainersPageContent />
  </Suspense>
);

export default ContainersPage;
