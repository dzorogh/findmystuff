"use client";

import { EntityListPage } from "@/components/lists/entity-list-page";
import { furnitureEntityConfig } from "@/lib/entities/furniture/entity-config";

export default function FurniturePage() {
  return <EntityListPage config={furnitureEntityConfig} />;
}
