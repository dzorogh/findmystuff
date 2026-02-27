"use client";

import { EntityListPage } from "@/components/lists/entity-list-page";
import { roomsEntityConfig } from "@/lib/entities/rooms/entity-config";

export default function RoomsPage() {
  return <EntityListPage config={roomsEntityConfig} />;
}
