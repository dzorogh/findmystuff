"use client";

import { Combobox, ComboboxContent, ComboboxList, ComboboxInput, ComboboxItem } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FieldLabel } from "@/components/ui/field";
import { useEntityTypeFilterOptions } from "@/lib/entities/hooks/use-entity-type-filter-options";

interface EntityTypeSelectProps {
  type: "place" | "container" | "room" | "item" | "building";
  value: number | null;
  onValueChange?: (value: string) => void;
}

type EntityTypeOption = {
  value: string;
  label: string;
}

export function EntityTypeSelect({ type, value, onValueChange }: EntityTypeSelectProps) {
  const { options: entityTypeOptions, isLoading: isLoadingEntityTypes } =
    useEntityTypeFilterOptions(type, false, true);

  const handleValueChange = (value: EntityTypeOption | null) => {
    if (!value) return;
    onValueChange?.(value.value);
  };

  const selectedEntityType = entityTypeOptions.find(option => option && option.value === value?.toString());

  return (
    <Field>
      <FieldLabel htmlFor="item-type">
        Тип
      </FieldLabel>

      <Combobox
        key={selectedEntityType ? `type-${selectedEntityType.value}` : "type-empty"}
        value={selectedEntityType ?? null}
        items={entityTypeOptions}
        onValueChange={handleValueChange}
      >
        {isLoadingEntityTypes ? (
          <Skeleton className="h-9 w-full" />
        ) : (
          <ComboboxInput id="entity-type" placeholder="Выберите тип..." />
        )}
        <ComboboxContent>
          <ComboboxList>
            {(option: typeof entityTypeOptions[number]) => (
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
