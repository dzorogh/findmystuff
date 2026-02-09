"use client";

import { Combobox, ComboboxContent, ComboboxList, ComboboxInput, ComboboxItem } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FieldLabel } from "@/components/ui/field";
import { useEntityTypeFilterOptions } from "@/lib/entities/hooks/use-entity-type-filter-options";

interface ItemTypeSelectProps {
  value: number | null;
  onValueChange?: (value: string) => void;
}

type ItemTypeOption = {
  value: string;
  label: string;
}

export function ItemTypeSelect({ value, onValueChange }: ItemTypeSelectProps) {
  const { options: itemTypeOptions, isLoading: isLoadingItemTypes } =
    useEntityTypeFilterOptions("item", false, true);

  const handleValueChange = (value: ItemTypeOption | null) => {
    if (!value) return;
    onValueChange?.(value.value);
  };

  const selectedItemType = itemTypeOptions.find(option => option && option.value === value?.toString());

  return (
    <Field>
      <FieldLabel htmlFor="item-type">
        Тип вещи
      </FieldLabel>

      <Combobox
        key={selectedItemType ? `type-${selectedItemType.value}` : "type-empty"}
        value={selectedItemType ?? null}
        items={itemTypeOptions}
        onValueChange={handleValueChange}
      >
        {isLoadingItemTypes ? (
          <Skeleton className="h-9 w-full" />
        ) : (
          <ComboboxInput id="item-type" placeholder="Выберите тип вещи..." />
        )}
        <ComboboxContent>
          <ComboboxList>
            {(option: typeof itemTypeOptions[number]) => (
              <ComboboxItem key={option?.value} value={option}>
                {option?.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}

export { ItemTypeSelect as ItemTypeFilter };
