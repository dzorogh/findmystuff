"use client";

import { Suspense } from "react";
import { ListPageContent } from "@/components/lists/list-page-content";
import { useListPage } from "@/lib/app/hooks/use-list-page";
import { roomsEntityConfig } from "@/lib/entities/rooms/entity-config";

function RoomsPageContent() {
  const listPage = useListPage(roomsEntityConfig);
  const getRowActions = roomsEntityConfig.useActions({ refreshList: listPage.refreshList });

  return <ListPageContent listPage={listPage} getRowActions={getRowActions} />;
}

const RoomsPage = () => (
  <Suspense fallback={null}>
    <RoomsPageContent />
  </Suspense>
);

export default RoomsPage;
