"use client";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Combobox } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityFiltersShell } from "./entity-filters-shell";
import { YesNoAllFilter } from "./yes-no-all-filter";
import {
  LOCATION_TYPE_OPTIONS,
  FILTER_COMBOBOX_TYPE,
  FILTER_COMBOBOX_DEFAULT,
  FILTER_FIELD_SKELETON_CLASS,
  mergeShowDeleted,
} from "./constants";
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
    onFiltersChange(mergeShowDeleted(filters, checked));
  };

  const handleEntityTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      entityTypeId: value === "all" ? null : parseInt(value, 10),
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
      onReset={onReset}
      hasActiveFilters={hasActiveFilters}
    >
      <FormField label="Тип контейнера">
        {isLoadingTypes ? (
          <Skeleton className={FILTER_FIELD_SKELETON_CLASS} />
        ) : (
          <Combobox
            options={containerTypeOptions}
            value={filters.entityTypeId ? filters.entityTypeId.toString() : "all"}
            onValueChange={handleEntityTypeChange}
            {...FILTER_COMBOBOX_TYPE}
          />
        )}
      </FormField>

      <YesNoAllFilter
        label="Есть вещи внутри"
        value={filters.hasItems}
        onChange={handleHasItemsChange}
      />

      <FormField label="Тип местоположения">
        <Combobox
          options={LOCATION_TYPE_OPTIONS}
          value={filters.locationType || "all"}
          onValueChange={handleLocationTypeChange}
          {...FILTER_COMBOBOX_DEFAULT}
        />
      </FormField>
    </EntityFiltersShell>
  );
};
