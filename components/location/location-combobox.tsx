"use client";

import * as React from "react";
import { Check, ChevronsUpDown, MapPin, Container as ContainerIcon, Building2 } from "lucide-react";
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
import { FormField } from "@/components/ui/form-field";
import { FormGroup } from "@/components/ui/form-group";
import { Skeleton } from "@/components/ui/skeleton";
import { useRooms } from "@/hooks/use-rooms";
import { usePlaces } from "@/hooks/use-places";
import { useContainers } from "@/hooks/use-containers";
import type { Container, Place, Room } from "@/types/entity";

interface LocationComboboxProps {
  destinationType: "room" | "place" | "container" | null;
  selectedDestinationId: string;
  onDestinationTypeChange: (type: "room" | "place" | "container" | null) => void;
  onDestinationIdChange: (id: string) => void;
  disabled?: boolean;
  showRoomFirst?: boolean;
  label?: string;
  id?: string;
}

const LocationCombobox = ({
  destinationType,
  selectedDestinationId,
  onDestinationTypeChange,
  onDestinationIdChange,
  disabled = false,
  showRoomFirst = true,
  label = "Местоположение (необязательно)",
  id = "location-combobox",
}: LocationComboboxProps) => {
  const { rooms, isLoading: isLoadingRooms } = useRooms();
  const { places, isLoading: isLoadingPlaces } = usePlaces();
  const { containers, isLoading: isLoadingContainers } = useContainers();
  const [open, setOpen] = React.useState(false);

  const isLoading =
    destinationType === "container"
      ? isLoadingContainers
      : destinationType === "place"
      ? isLoadingPlaces
      : destinationType === "room"
      ? isLoadingRooms
      : false;

  const destinations =
    destinationType === "container"
      ? containers
      : destinationType === "place"
      ? places
      : destinationType === "room"
      ? rooms
      : [];

  const destinationLabel =
    destinationType === "container"
      ? "контейнер"
      : destinationType === "place"
      ? "местоположение"
      : destinationType === "room"
      ? "помещение"
      : "";

  const buttonOrder = showRoomFirst
    ? [
        { type: "room" as const, label: "Помещение", icon: Building2 },
        { type: "place" as const, label: "Место", icon: MapPin },
        { type: "container" as const, label: "Контейнер", icon: ContainerIcon },
      ]
    : [
        { type: "place" as const, label: "Место", icon: MapPin },
        { type: "container" as const, label: "Контейнер", icon: ContainerIcon },
        { type: "room" as const, label: "Помещение", icon: Building2 },
      ];

  const selectedDestination = destinations.find(
    (dest) => dest.id.toString() === selectedDestinationId
  );

  const getDisplayName = (dest: Container | Place | Room) => {
    const displayName =
      dest.name ||
      `${
        destinationType === "container"
          ? "Контейнер"
          : destinationType === "place"
          ? "Место"
          : "Помещение"
      } #${dest.id}`;

    const typeName =
      destinationType === "container" || destinationType === "place"
        ? (dest as Container | Place).entity_type?.name
        : null;

    return typeName ? `${displayName} (${typeName})` : displayName;
  };

  return (
    <FormGroup>
      <FormField label={label}>
        <div className="flex gap-2">
          {buttonOrder.map(({ type, label: btnLabel, icon: Icon }) => (
            <Button
              key={type}
              type="button"
              variant={destinationType === type ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => {
                onDestinationTypeChange(type);
                onDestinationIdChange("");
                setOpen(false);
              }}
              disabled={disabled}
            >
              <Icon className="mr-2 h-4 w-4" />
              {btnLabel}
            </Button>
          ))}
        </div>
      </FormField>

      {destinationType && (
        <FormField label={`Выберите ${destinationLabel}`} htmlFor={`${id}-combobox`}>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                disabled={disabled || (isLoading ? false : destinations.length === 0)}
                id={`${id}-combobox`}
              >
                {selectedDestination
                  ? getDisplayName(selectedDestination)
                  : `-- Выберите ${destinationLabel} --`}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command>
                <CommandInput placeholder={`Поиск ${destinationLabel}...`} />
                <CommandList>
                  {isLoading ? (
                    <div className="p-4 space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-9 w-full" />
                      ))}
                    </div>
                  ) : (
                    <>
                      <CommandEmpty>
                        {destinationType === "container"
                          ? "Контейнеры не найдены"
                          : destinationType === "place"
                          ? "Местоположения не найдены"
                          : "Помещения не найдены"}
                      </CommandEmpty>
                      <CommandGroup>
                        {destinations.map((dest) => {
                          const displayName = getDisplayName(dest);
                          const isSelected = dest.id.toString() === selectedDestinationId;
                          const itemValue = `${dest.id}-${displayName}`;
                          return (
                            <CommandItem
                              key={dest.id}
                              value={itemValue}
                              keywords={[dest.id.toString(), displayName, dest.name || ""]}
                              onSelect={() => {
                                onDestinationIdChange(dest.id.toString());
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
          {!isLoading && destinations.length === 0 && (
            <p className="text-xs text-muted-foreground">
              {destinationType === "container"
                ? "Контейнеры не найдены"
                : destinationType === "place"
                ? "Местоположения не найдены"
                : "Помещения не найдены"}
            </p>
          )}
        </FormField>
      )}
    </FormGroup>
  );
};

export default LocationCombobox;
