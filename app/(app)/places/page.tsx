"use client";

import { EntityListPage } from "@/components/lists/entity-list-page";
import { placesEntityConfig } from "@/lib/entities/places/entity-config";

export default function PlacesPage() {
  return <EntityListPage config={placesEntityConfig} />;
}
