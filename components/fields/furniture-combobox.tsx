"use client";

import * as React from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { useFurnitureFilterOptions } from "@/lib/furniture/hooks/use-furniture-filter-options";

interface FurnitureComboboxProps {
  selectedFurnitureId: string;
  onFurnitureIdChange: (id: string) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
  required?: boolean;
  /** Показывать опцию «Не указано» для сброса. По умолчанию false. */
  allowNone?: boolean;
}

const FurnitureCombobox = ({
  selectedFurnitureId,
  onFurnitureIdChange,
  disabled = false,
  label = "Выберите мебель",
  id = "furniture-combobox",
  required = false,
  allowNone = false,
}: FurnitureComboboxProps) => {
  const { options, isLoading } = useFurnitureFilterOptions();

  const items = React.useMemo(() => {
    const filtered = options.filter((o) => o.value !== "all");
    if (allowNone) {
      return [{ value: "", label: "Не указано" }, ...filtered];
    }
    return filtered;
  }, [options, allowNone]);

  const selectedItem = items.find((i) => i.value === selectedFurnitureId) ?? null;

  const handleValueChange = (item: { value: string; label: string } | null) => {
    onFurnitureIdChange(item?.value ?? "");
  };

  const isEmpty = items.length === 0 || (allowNone && items.length === 1);

  return (
    <Field>
      <FieldLabel htmlFor={`${id}-combobox`}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </FieldLabel>
      <Combobox
        value={selectedItem}
        items={items}
        onValueChange={handleValueChange}
        disabled={disabled || (isLoading ? false : isEmpty)}
      >
        {isLoading ? (
          <Skeleton className="h-8 w-full" />
        ) : (
          <ComboboxInput
            id={`${id}-combobox`}
            placeholder="Поиск мебели..."
          />
        )}
        <ComboboxContent>
          <ComboboxEmpty>Мебель не найдена</ComboboxEmpty>
          <ComboboxList>
            {(item: { value: string; label: string }) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {!isLoading && isEmpty && !allowNone && (
        <p className="text-xs text-muted-foreground">
          Мебель не найдена. Сначала создайте мебель.
        </p>
      )}
    </Field>
  );
};

export default FurnitureCombobox;
