"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FormField } from "@/components/ui/form-field";
import { useContainers } from "@/hooks/use-containers";
import { getEntityDisplayName } from "@/lib/entity-display-name";
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
  const { containers } = useContainers();
  const [open, setOpen] = React.useState(false);

  const availableContainers = excludeContainerId
    ? containers.filter((c) => c.id !== excludeContainerId)
    : containers;

  const selectedContainer = availableContainers.find(
    (container) => container.id.toString() === selectedContainerId
  );

  const getDisplayName = (container: Container) => {
    const displayName = getEntityDisplayName("container", container.id, container.name);
    const typeName = container.entity_type?.name;
    return typeName ? `${displayName} (${typeName})` : displayName;
  };

  return (
    <FormField
      label={label}
      htmlFor={`${id}-combobox`}
      required={required}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled || availableContainers.length === 0}
            id={`${id}-combobox`}
          >
            {selectedContainer
              ? getDisplayName(selectedContainer)
              : "-- Выберите контейнер --"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Поиск контейнера..." />
            <CommandList>
              <CommandEmpty>Контейнеры не найдены</CommandEmpty>
              <CommandGroup>
                {availableContainers.map((container) => {
                  const displayName = getDisplayName(container);
                  const isSelected = container.id.toString() === selectedContainerId;
                  const itemValue = `${container.id}-${displayName}`;
                  return (
                    <CommandItem
                      key={container.id}
                      value={itemValue}
                      keywords={[
                        container.id.toString(),
                        displayName,
                        container.name || "",
                        container.entity_type?.name || "",
                      ]}
                      onSelect={() => {
                        onContainerIdChange(container.id.toString());
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {displayName}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {availableContainers.length === 0 && (
        <p className="text-xs text-destructive">
          Контейнеры не найдены. Сначала создайте контейнер.
        </p>
      )}
    </FormField>
  );
};

export default ContainerCombobox;
