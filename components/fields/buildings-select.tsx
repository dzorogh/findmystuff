"use client";

import { Combobox, ComboboxContent, ComboboxList, ComboboxInput, ComboboxItem } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FieldLabel } from "@/components/ui/field";
import { useBuildingFilterOptions } from "@/lib/buildings/hooks/use-building-filter-options";

interface BuildingsSelectProps {
  value: number | null;
  onValueChange?: (value: string | null) => void;
}

type BuildingOption = {
  value: string;
  label: string;
};

export function BuildingsSelect({ value, onValueChange }: BuildingsSelectProps) {
  const { options: buildingOptions, isLoading: isLoadingBuildings } =
    useBuildingFilterOptions();

  const handleValueChange = (value: BuildingOption | null) => {
    onValueChange?.(value === null ? null : value.value);
  };

  const selectedBuilding = buildingOptions.find((option) => option.value === value?.toString());

  return (
    <Field>
      <FieldLabel htmlFor="building">Здания</FieldLabel>

      <Combobox
        value={selectedBuilding ?? null}
        items={buildingOptions}
        onValueChange={handleValueChange}
      >
        {isLoadingBuildings ? (
          <Skeleton className="h-8 w-full" />
        ) : (
          <ComboboxInput id="building" placeholder="Выберите здание..." />
        )}
        <ComboboxContent>
          <ComboboxList>
            {(option: (typeof buildingOptions)[number]) => (
              <ComboboxItem key={option.value} value={option}>
                {option.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
