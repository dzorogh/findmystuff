"use client";

import { FormField } from "@/components/ui/form-field";
import { Combobox } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityFiltersShell } from "./entity-filters-shell";
import { useEntityTypeFilterOptions } from "@/lib/entities/hooks/use-entity-type-filter-options";
import { useRoomFilterOptions } from "@/lib/rooms/hooks/use-room-filter-options";
import { LocationTypeSelect } from "../fields/location-type-select";
import { RoomsSelect } from "../fields/rooms-select";

export interface PlacesFilters {
  showDeleted: boolean;
  entityTypeId: number | null;
  roomId: number | null;
}

interface PlacesFiltersPanelProps {
  filters: PlacesFilters;
  onFiltersChange: (filters: PlacesFilters) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export const PlacesFiltersPanel = ({
  filters,
  onFiltersChange,
  onReset,
  hasActiveFilters,
}: PlacesFiltersPanelProps) => {
  const { options: placeTypeOptions, isLoading: isLoadingTypes } =
    useEntityTypeFilterOptions("place");
  const { options: roomOptions, isLoading: isLoadingRooms } =
    useRoomFilterOptions();

  const handleShowDeletedChange = (checked: boolean) => {
    onFiltersChange({ ...filters, showDeleted: checked });
  };

  const handleEntityTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      entityTypeId: value === "all" ? null : parseInt(value, 10),
    });
  };

  const handleRoomChange = (value: string) => {
    onFiltersChange({
      ...filters,
      roomId: value === "all" ? null : parseInt(value, 10),
    });
  };

  return (
    <EntityFiltersShell
      showDeletedLabel="Показывать удаленные места"
      showDeleted={filters.showDeleted}
      onShowDeletedChange={handleShowDeletedChange}
    >
      <LocationTypeSelect
        value={filters.locationType}
        onValueChange={handleLocationTypeChange}
      />

      <RoomsSelect
        value={filters.roomId}
        onValueChange={handleRoomChange}
      />
    </EntityFiltersShell>
  );
};
