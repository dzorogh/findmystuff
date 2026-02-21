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
import { useBuildings } from "@/lib/buildings/hooks/use-buildings";

interface BuildingComboboxProps {
  selectedBuildingId: string;
  onBuildingIdChange: (id: string) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
  required?: boolean;
  /** Показывать опцию «Не указано» для сброса. По умолчанию true. */
  allowNone?: boolean;
}

const BuildingCombobox = ({
  selectedBuildingId,
  onBuildingIdChange,
  disabled = false,
  label = "Выберите здание",
  id = "building-combobox",
  required = false,
  allowNone = true,
}: BuildingComboboxProps) => {
  const { buildings, isLoading } = useBuildings();

  const items = React.useMemo(() => {
    const buildingItems = buildings.map((b) => ({
      value: b.id.toString(),
      label: b.name || `Здание #${b.id}`,
    }));
    return allowNone ? [{ value: "", label: "Не указано" }, ...buildingItems] : buildingItems;
  }, [buildings, allowNone]);

  const selectedItem = items.find((i) => i.value === selectedBuildingId) ?? null;

  const handleValueChange = (item: { value: string; label: string } | null) => {
    onBuildingIdChange(item?.value ?? "");
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
            placeholder="Поиск здания..."
          />
        )}
        <ComboboxContent keepMounted>
          <ComboboxEmpty>Здания не найдены</ComboboxEmpty>
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
          Здания не найдены. Сначала создайте здание.
        </p>
      )}
    </Field>
  );
};

export default BuildingCombobox;
