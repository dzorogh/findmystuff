"use client";

import { Button } from "@/components/ui/button";
import { FormGroup } from "@/components/ui/form-group";
import { YesNoAllFilter } from "./yes-no-all-filter";
import { ShowDeletedCheckbox } from "./show-deleted-checkbox";

export interface RoomsFilters {
  showDeleted: boolean;
  hasItems: boolean | null;
  hasContainers: boolean | null;
  hasPlaces: boolean | null;
}

interface RoomsFiltersPanelProps {
  filters: RoomsFilters;
  onFiltersChange: (filters: RoomsFilters) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export const RoomsFiltersPanel = ({
  filters,
  onFiltersChange,
  onReset,
  hasActiveFilters,
}: RoomsFiltersPanelProps) => {
  const handleShowDeletedChange = (checked: boolean) => {
    onFiltersChange({ ...filters, showDeleted: checked });
  };

  const handleHasItemsChange = (value: boolean | null) => {
    onFiltersChange({ ...filters, hasItems: value });
  };

  const handleHasContainersChange = (value: boolean | null) => {
    onFiltersChange({ ...filters, hasContainers: value });
  };

  const handleHasPlacesChange = (value: boolean | null) => {
    onFiltersChange({ ...filters, hasPlaces: value });
  };

  return (
    <FormGroup>
      <ShowDeletedCheckbox
        label="Показывать удаленные помещения"
        checked={filters.showDeleted}
        onChange={handleShowDeletedChange}
      />

      <YesNoAllFilter
        label="Есть вещи"
        value={filters.hasItems}
        onChange={handleHasItemsChange}
      />

      <YesNoAllFilter
        label="Есть контейнеры"
        value={filters.hasContainers}
        onChange={handleHasContainersChange}
      />

      <YesNoAllFilter
        label="Есть места"
        value={filters.hasPlaces}
        onChange={handleHasPlacesChange}
      />

      {hasActiveFilters && (
        <Button variant="outline" className="w-full" onClick={onReset}>
          Сбросить фильтры
        </Button>
      )}
    </FormGroup>
  );
};
