"use client";

import { EntityFiltersShell } from "./entity-filters-shell";
import { YesNoAllFilter } from "./yes-no-all-filter";

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
  /** В режиме controlled вызывается при переключении «Показывать удалённые» вместо обновления внутреннего состояния */
  onShowDeletedChange?: (show: boolean) => void;
}

export const RoomsFiltersPanel = ({
  filters,
  onFiltersChange,
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
    <EntityFiltersShell
      showDeletedLabel="Показывать удаленные помещения"
      showDeleted={filters.showDeleted}
      onShowDeletedChange={handleShowDeletedChange}
    >
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
    </EntityFiltersShell>
  );
};
