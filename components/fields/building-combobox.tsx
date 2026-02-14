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
}

const BuildingCombobox = ({
  selectedBuildingId,
  onBuildingIdChange,
  disabled = false,
  label = "Выберите здание",
  id = "building-combobox",
  required = false,
}: BuildingComboboxProps) => {
  const { buildings, isLoading } = useBuildings();
  const [open, setOpen] = React.useState(false);

  const selectedBuilding = buildings.find(
    (b) => b.id.toString() === selectedBuildingId
  );

  return (
    <Field>
      <FieldLabel htmlFor={`${id}-combobox`}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={disabled || (isLoading ? false : buildings.length === 0)}
              id={`${id}-combobox`}
            >
              {selectedBuilding
                ? selectedBuilding.name || `Здание #${selectedBuilding.id}`
                : "-- Выберите здание (необязательно) --"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          }
          nativeButton={true}
        />
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Поиск здания..." />
            <CommandList>
              {isLoading ? (
                <div className="p-2 space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <CommandEmpty>Здания не найдены</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="0"
                      keywords={["none", "не указано", "пусто"]}
                      onSelect={() => {
                        onBuildingIdChange("");
                        setOpen(false);
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", selectedBuildingId === "" ? "opacity-100" : "opacity-0")} />
                      Не указано
                    </CommandItem>
                    {buildings.map((building) => {
                      const displayName = building.name || `Здание #${building.id}`;
                      const isSelected = building.id.toString() === selectedBuildingId;
                      const itemValue = `${building.id}-${displayName}`;
                      return (
                        <CommandItem
                          key={building.id}
                          value={itemValue}
                          keywords={[building.id.toString(), displayName, building.name || ""]}
                          onSelect={() => {
                            onBuildingIdChange(building.id.toString());
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
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </Field>
  );
};

export default BuildingCombobox;
