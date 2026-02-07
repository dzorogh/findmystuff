"use client";

import { EntityFiltersShell } from "./entity-filters-shell";
import { YesNoAllFilter } from "./yes-no-all-filter";
import { LocationTypeSelect } from "../fields/location-type-select";
import { RoomsSelect } from "../fields/rooms-select";

export interface ItemsFilters {
  showDeleted: boolean;
  locationType: "all" | "room" | "place" | "container" | null;
  hasPhoto: boolean | null;
  roomId: number | null;
}

interface ItemsFiltersPanelProps {
  filters: ItemsFilters;
  onFiltersChange: (filters: ItemsFilters) => void;
  hasActiveFilters: boolean;
}

export const ItemsFiltersPanel = ({
  filters,
  onFiltersChange,
  hasActiveFilters,
}: ItemsFiltersPanelProps) => {
  const handleShowDeletedChange = (checked: boolean) => {
    onFiltersChange({ ...filters, showDeleted: checked });
  };

  const handleLocationTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      locationType: value === "all" ? null : (value as "room" | "place" | "container"),
    });
  };

  const handleHasPhotoChange = (value: boolean | null) => {
    onFiltersChange({ ...filters, hasPhoto: value });
  };

  const handleRoomChange = (value: string | null) => {
    onFiltersChange({
      ...filters,
      roomId: value === "all" || value == null ? null : parseInt(value, 10),
    });
  };

  return (
    <EntityFiltersShell
      showDeletedLabel="Показывать удаленные вещи"
      showDeleted={filters.showDeleted}
      onShowDeletedChange={handleShowDeletedChange}
    >
      <LocationTypeSelect
        value={filters.locationType}
        onValueChange={handleLocationTypeChange}
      />

      <YesNoAllFilter
        label="Есть фото"
        value={filters.hasPhoto}
        onChange={handleHasPhotoChange}
      />

      <RoomsSelect
        value={filters.roomId}
        onValueChange={handleRoomChange}
      />
    </EntityFiltersShell>
  );
};
