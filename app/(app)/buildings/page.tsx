"use client";

import { EntityListPage } from "@/components/lists/entity-list-page";
import { buildingsEntityConfig } from "@/lib/entities/buildings/entity-config";

export default function BuildingsPage() {
  return <EntityListPage config={buildingsEntityConfig} />;
}
