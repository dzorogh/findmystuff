"use client";

import { FormField } from "@/components/ui/form-field";
import { Combobox } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityFiltersShell } from "./entity-filters-shell";
import { YesNoAllFilter } from "./yes-no-all-filter";
import { LocationTypeSelect } from "../fields/location-type-select";
import { useEntityTypeFilterOptions } from "@/lib/entities/hooks/use-entity-type-filter-options";

export interface ContainersFilters {
  showDeleted: boolean;
  entityTypeId: number | null;
  hasItems: boolean | null;
  locationType: "all" | "room" | "place" | "container" | null;
}

interface ContainersFiltersPanelProps {
  filters: ContainersFilters;
  onFiltersChange: (filters: ContainersFilters) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export const ContainersFiltersPanel = ({
  filters,
  onFiltersChange,
  onReset,
  hasActiveFilters,
}: ContainersFiltersPanelProps) => {
  const { options: containerTypeOptions, isLoading: isLoadingTypes } =
    useEntityTypeFilterOptions("container");

  const handleShowDeletedChange = (checked: boolean) => {
    onFiltersChange({ ...filters, showDeleted: checked });
  };

  const handleEntityTypeChange = (value: string | null) => {
    onFiltersChange({
      ...filters,
      entityTypeId: value === "all" || value == null ? null : parseInt(value, 10),
    });
  };

  const handleHasItemsChange = (value: boolean | null) => {
    onFiltersChange({ ...filters, hasItems: value });
  };

  const handleLocationTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      locationType: value === "all" ? null : (value as "room" | "place" | "container"),
    });
  };

  return (
    <EntityFiltersShell
      showDeletedLabel="Показывать удаленные контейнеры"
      showDeleted={filters.showDeleted}
      onShowDeletedChange={handleShowDeletedChange}
    >
      <FormField label="Тип контейнера">
        {isLoadingTypes ? (
          <Skeleton className="h-9 w-full" />
        ) : (
          <Combobox
            items={containerTypeOptions}
            value={filters.entityTypeId ? filters.entityTypeId.toString() : "all"}
            onValueChange={handleEntityTypeChange}
          />  
        )}
      </FormField>

      <YesNoAllFilter
        label="Есть вещи внутри"
        value={filters.hasItems}
        onChange={handleHasItemsChange}
      />

      <LocationTypeSelect
        value={filters.locationType}
        onValueChange={handleLocationTypeChange}
      />
    </EntityFiltersShell>
  );
};
