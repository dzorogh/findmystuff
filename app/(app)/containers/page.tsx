"use client";

import { EntityListPage } from "@/components/lists/entity-list-page";
import { containersEntityConfig } from "@/lib/entities/containers/entity-config";

export default function ContainersPage() {
  return <EntityListPage config={containersEntityConfig} />;
}
