"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { FormGroup } from "@/components/ui/form-group";
import { YesNoAllFilter } from "./yes-no-all-filter";
import { ShowDeletedCheckbox } from "./show-deleted-checkbox";
import { FormField } from "@/components/ui/form-field";
import { Combobox } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { useEntityTypes } from "@/hooks/use-entity-types";

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

const LOCATION_TYPE_OPTIONS = [
  { value: "all", label: "Все" },
  { value: "room", label: "Помещение" },
  { value: "place", label: "Место" },
  { value: "container", label: "Контейнер" },
] as const;

export const ContainersFiltersPanel = ({
  filters,
  onFiltersChange,
  onReset,
  hasActiveFilters,
}: ContainersFiltersPanelProps) => {
  const { types: entityTypes, isLoading: isLoadingTypes } = useEntityTypes("container");
  const containerTypeOptions = useMemo(() => {
    if (isLoadingTypes) {
      return [{ value: "all", label: "Все типы" }];
    }
    if (entityTypes && entityTypes.length > 0) {
      return [
        { value: "all", label: "Все типы" },
        ...entityTypes.map((type) => ({
          value: type.id.toString(),
          label: type.name,
        })),
      ];
    }
    return [{ value: "all", label: "Все типы" }];
  }, [entityTypes, isLoadingTypes]);

  const handleShowDeletedChange = (checked: boolean) => {
    onFiltersChange({ ...filters, showDeleted: checked });
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
    <FormGroup>
      <ShowDeletedCheckbox
        label="Показывать удаленные контейнеры"
        checked={filters.showDeleted}
        onChange={handleShowDeletedChange}
      />

      <FormField label="Тип контейнера">
        {isLoadingTypes ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Combobox
            options={containerTypeOptions}
            value={filters.entityTypeId ? filters.entityTypeId.toString() : "all"}
            onValueChange={handleEntityTypeChange}
            placeholder="Выберите тип..."
            searchPlaceholder="Поиск типа..."
            emptyText="Типы не найдены"
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
          placeholder="Выберите..."
          searchPlaceholder="Поиск..."
          emptyText="Не найдено"
        />
      </FormField>

      {hasActiveFilters && (
        <Button variant="outline" className="w-full" onClick={onReset}>
          Сбросить фильтры
        </Button>
      )}
    </FormGroup>
  );
};
