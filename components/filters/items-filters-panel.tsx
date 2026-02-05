"use client";

import { FormField } from "@/components/ui/form-field";
import { Combobox } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityFiltersShell } from "./entity-filters-shell";
import { YesNoAllFilter } from "./yes-no-all-filter";
import {
  LOCATION_TYPE_OPTIONS,
  FILTER_COMBOBOX_DEFAULT,
  FILTER_COMBOBOX_ROOM,
  FILTER_FIELD_SKELETON_CLASS,
  mergeShowDeleted,
} from "./constants";
import { useRoomFilterOptions } from "@/lib/rooms/hooks/use-room-filter-options";

export interface ItemsFilters {
  showDeleted: boolean;
  locationType: "all" | "room" | "place" | "container" | null;
  hasPhoto: boolean | null;
  roomId: number | null;
}

interface ItemsFiltersPanelProps {
  filters: ItemsFilters;
  onFiltersChange: (filters: ItemsFilters) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export const ItemsFiltersPanel = ({
  filters,
  onFiltersChange,
  onReset,
  hasActiveFilters,
}: ItemsFiltersPanelProps) => {
  const { options: roomOptions, isLoading: isLoadingRooms } =
    useRoomFilterOptions();

  const handleShowDeletedChange = (checked: boolean) => {
    onFiltersChange(mergeShowDeleted(filters, checked));
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

  const handleRoomChange = (value: string) => {
    onFiltersChange({
      ...filters,
      roomId: value === "all" ? null : parseInt(value, 10),
    });
  };

  return (
    <EntityFiltersShell
      showDeletedLabel="Показывать удаленные вещи"
      showDeleted={filters.showDeleted}
      onShowDeletedChange={handleShowDeletedChange}
      onReset={onReset}
      hasActiveFilters={hasActiveFilters}
    >
      <FormField label="Тип местоположения">
        <Combobox
          options={LOCATION_TYPE_OPTIONS}
          value={filters.locationType || "all"}
          onValueChange={handleLocationTypeChange}
          {...FILTER_COMBOBOX_DEFAULT}
        />
      </FormField>

      <YesNoAllFilter
        label="Есть фото"
        value={filters.hasPhoto}
        onChange={handleHasPhotoChange}
      />

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
