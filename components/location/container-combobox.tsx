"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Container } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { useContainers } from "@/hooks/use-containers";
import { useContainerMarking } from "@/hooks/use-container-marking";
import { type ContainerType } from "@/lib/utils";

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
  const { generateMarking } = useContainerMarking();
  const [open, setOpen] = React.useState(false);

  const availableContainers = excludeContainerId
    ? containers.filter((c) => c.id !== excludeContainerId)
    : containers;

  const selectedContainer = availableContainers.find(
    (container) => container.id.toString() === selectedContainerId
  );

  const getDisplayName = (container: any) => {
    const containerMarking =
      container.entity_type && "marking_number" in container
        ? generateMarking(
            container.entity_type.code as ContainerType,
            container.marking_number as number | null
          )
        : null;

    const displayName =
      container.name || `Контейнер #${container.id}`;

    return containerMarking ? `${displayName} (${containerMarking})` : displayName;
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`${id}-combobox`}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
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
                        container.entity_type?.code || "",
                        container.entity_type?.name || "",
                        generateMarking(
                          container.entity_type?.code as ContainerType,
                          container.marking_number as number | null
                        ) || "",
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
    </div>
  );
};

export default ContainerCombobox;
