"use client";

import { Suspense } from "react";
import { ListPageContent } from "@/components/lists/list-page-content";
import { useListPage } from "@/lib/app/hooks/use-list-page";
import { placesEntityConfig } from "@/lib/entities/places/entity-config";

function PlacesPageContent() {
  const listPage = useListPage(placesEntityConfig);
  const getRowActions = placesEntityConfig.useActions({ refreshList: listPage.refreshList });

  return <ListPageContent listPage={listPage} getRowActions={getRowActions} />;
}

const PlacesPage = () => (
  <Suspense fallback={null}>
    <PlacesPageContent />
  </Suspense>
);

export default PlacesPage;
