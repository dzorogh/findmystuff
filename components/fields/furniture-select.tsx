"use client";

import { Combobox, ComboboxContent, ComboboxList, ComboboxInput, ComboboxItem } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FieldLabel } from "@/components/ui/field";
import { useFurnitureFilterOptions } from "@/lib/furniture/hooks/use-furniture-filter-options";

interface FurnitureSelectProps {
  value: number | null;
  onValueChange?: (value: string | null) => void;
}

type FurnitureOption = {
  value: string;
  label: string;
};

export function FurnitureSelect({ value, onValueChange }: FurnitureSelectProps) {
  const { options: furnitureOptions, isLoading: isLoadingFurniture } =
    useFurnitureFilterOptions();

  const handleValueChange = (value: FurnitureOption | null) => {
    onValueChange?.(value === null ? null : value.value);
  };

  const selectedFurniture = furnitureOptions.find((option) => option.value === value?.toString());

  return (
    <Field>
      <FieldLabel htmlFor="furniture">Мебель</FieldLabel>

      <Combobox
        value={selectedFurniture ?? null}
        items={furnitureOptions}
        onValueChange={handleValueChange}
      >
        {isLoadingFurniture ? (
          <Skeleton className="h-8 w-full" />
        ) : (
          <ComboboxInput id="furniture" placeholder="Выберите мебель..." />
        )}
        <ComboboxContent>
          <ComboboxList>
            {(option: (typeof furnitureOptions)[number]) => (
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
