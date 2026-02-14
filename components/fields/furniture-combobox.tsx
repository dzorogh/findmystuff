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
  const [open, setOpen] = React.useState(false);

  const selectedOption = options.find((o) => o.value === selectedFurnitureId && o.value !== "all");

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
              disabled={disabled || (isLoading ? false : options.length <= (allowNone ? 1 : 0))}
              id={`${id}-combobox`}
            >
              {selectedOption
                ? selectedOption.label
                : allowNone
                  ? "-- Выберите мебель (необязательно) --"
                  : "-- Выберите мебель --"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          }
          nativeButton={true}
        />
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Поиск мебели..." />
            <CommandList>
              {isLoading ? (
                <div className="p-2 space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <CommandEmpty>Мебель не найдена</CommandEmpty>
                  <CommandGroup>
                    {allowNone && (
                      <CommandItem
                        value="0"
                        keywords={["none", "не указано", "пусто"]}
                        onSelect={() => {
                          onFurnitureIdChange("");
                          setOpen(false);
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", selectedFurnitureId === "" ? "opacity-100" : "opacity-0")} />
                        Не указано
                      </CommandItem>
                    )}
                    {options
                      .filter((o) => o.value !== "all")
                      .map((opt) => {
                        const isSelected = opt.value === selectedFurnitureId;
                        return (
                          <CommandItem
                            key={opt.value}
                            value={`${opt.value}-${opt.label}`}
                            keywords={[opt.value, opt.label]}
                            onSelect={() => {
                              onFurnitureIdChange(opt.value);
                              setOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                            {opt.label}
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

export default FurnitureCombobox;
