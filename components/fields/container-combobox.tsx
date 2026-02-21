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
import { useContainers } from "@/lib/containers/hooks/use-containers";
import { getEntityDisplayName } from "@/lib/entities/helpers/display-name";
import type { Container } from "@/types/entity";

interface ContainerComboboxProps {
  selectedContainerId: string;
  onContainerIdChange: (id: string) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
  required?: boolean;
  excludeContainerId?: number;
}

const ContainerCombobox = ({
  selectedContainerId,
  onContainerIdChange,
  disabled = false,
  label = "Выберите контейнер",
  id = "container-combobox",
  required = false,
  excludeContainerId,
}: ContainerComboboxProps) => {
  const { containers, isLoading } = useContainers();

  const availableContainers =
    excludeContainerId != null
      ? containers.filter((c) => c.id !== excludeContainerId)
      : containers;

  const items = React.useMemo(() => {
    const getDisplayName = (c: Container) => {
      const displayName = getEntityDisplayName("container", c.id, c.name);
      const typeName = c.entity_type?.name;
      return typeName ? `${displayName} (${typeName})` : displayName;
    };
    return availableContainers.map((c) => ({
      value: c.id.toString(),
      label: getDisplayName(c),
    }));
  }, [availableContainers]);

  const selectedItem = items.find((i) => i.value === selectedContainerId) ?? null;

  const handleValueChange = (item: { value: string; label: string } | null) => {
    onContainerIdChange(item?.value ?? "");
  };

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
        disabled={disabled || (isLoading ? false : items.length === 0)}
      >
        {isLoading ? (
          <Skeleton className="h-8 w-full" />
        ) : (
          <ComboboxInput
            id={`${id}-combobox`}
            placeholder="Поиск контейнера..."
          />
        )}
        <ComboboxContent>
          <ComboboxEmpty>Контейнеры не найдены</ComboboxEmpty>
          <ComboboxList>
            {(item: { value: string; label: string }) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {!isLoading && items.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Контейнеры не найдены. Сначала создайте контейнер.
        </p>
      )}
    </Field>
  );
};

export default ContainerCombobox;
