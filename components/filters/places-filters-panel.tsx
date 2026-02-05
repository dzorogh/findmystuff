"use client";

import { FormField } from "@/components/ui/form-field";
import { Combobox } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityFiltersShell } from "./entity-filters-shell";
import { useEntityTypeFilterOptions } from "@/lib/entities/hooks/use-entity-type-filter-options";
import { useRoomFilterOptions } from "@/lib/rooms/hooks/use-room-filter-options";
import {
  FILTER_COMBOBOX_TYPE,
  FILTER_COMBOBOX_ROOM,
  FILTER_FIELD_SKELETON_CLASS,
  mergeShowDeleted,
} from "./constants";

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
    onFiltersChange(mergeShowDeleted(filters, checked));
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
      onReset={onReset}
      hasActiveFilters={hasActiveFilters}
    >
      <FormField label="Тип места">
        {isLoadingTypes ? (
          <Skeleton className={FILTER_FIELD_SKELETON_CLASS} />
        ) : (
          <Combobox
            options={placeTypeOptions}
            value={filters.entityTypeId ? filters.entityTypeId.toString() : "all"}
            onValueChange={handleEntityTypeChange}
            {...FILTER_COMBOBOX_TYPE}
          />
        )}
      </FormField>

      <FormField label="Помещение">
        {isLoadingRooms ? (
          <Skeleton className={FILTER_FIELD_SKELETON_CLASS} />
        ) : (
          <Combobox
            options={roomOptions}
            value={filters.roomId ? filters.roomId.toString() : "all"}
            onValueChange={handleRoomChange}
            {...FILTER_COMBOBOX_ROOM}
          />
        )}
      </FormField>
    </EntityFiltersShell>
  );
};
