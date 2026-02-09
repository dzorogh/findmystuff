"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Warehouse, Container as ContainerIcon, Building2 } from "lucide-react";
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { useRooms } from "@/lib/rooms/hooks/use-rooms";
import { usePlaces } from "@/lib/places/hooks/use-places";
import { useContainers } from "@/lib/containers/hooks/use-containers";
import type { Container, Place, Room } from "@/types/entity";

export type DestinationType = "room" | "place" | "container";

interface LocationComboboxProps {
  destinationType: DestinationType | null;
  selectedDestinationId: string;
  onDestinationTypeChange: (type: DestinationType | null) => void;
  onDestinationIdChange: (id: string) => void;
  disabled?: boolean;
  /** When set, only these destination types are shown (e.g. for move form). */
  allowedTypes?: DestinationType[];
  /** When moving a container, exclude this id from container list. */
  excludeContainerId?: number;
  label?: string;
  id?: string;
}

const LocationCombobox = ({
  destinationType,
  selectedDestinationId,
  onDestinationTypeChange,
  onDestinationIdChange,
  disabled = false,
  allowedTypes,
  excludeContainerId,
  label = "Местоположение (необязательно)",
  id = "location-combobox",
}: LocationComboboxProps) => {
  const { rooms, isLoading: isLoadingRooms } = useRooms();
  const { places, isLoading: isLoadingPlaces } = usePlaces();
  const { containers, isLoading: isLoadingContainers } = useContainers();
  const [open, setOpen] = React.useState(false);

  const loadingByType: Record<DestinationType, boolean> = {
    container: isLoadingContainers,
    place: isLoadingPlaces,
    room: isLoadingRooms,
  };
  const isLoading = destinationType ? loadingByType[destinationType] : false;

  const dataByType: Record<DestinationType, (Room | Place | Container)[]> = {
    container: containers,
    place: places,
    room: rooms,
  };
  const rawDestinations = destinationType ? dataByType[destinationType] : [];
  const destinations =
    destinationType === "container" && excludeContainerId != null
      ? rawDestinations.filter((c) => (c as { id: number }).id !== excludeContainerId)
      : rawDestinations;

  const labelByType: Record<DestinationType, string> = {
    container: "контейнер",
    place: "местоположение",
    room: "помещение",
  };
  const fallbackNameByType: Record<DestinationType, string> = {
    container: "Контейнер",
    place: "Место",
    room: "Помещение",
  };
  const destinationLabel = destinationType ? labelByType[destinationType] : "";

  const buttonOrderOptions = [
    { type: "room" as const, label: "Помещение", icon: Building2 },
    { type: "place" as const, label: "Место", icon: Warehouse },
    { type: "container" as const, label: "Контейнер", icon: ContainerIcon },
  ];
  const buttonOrder = allowedTypes?.length
    ? buttonOrderOptions.filter((b) => allowedTypes.includes(b.type))
    : buttonOrderOptions;

  const selectedDestination = destinations.find(
    (dest) => dest.id.toString() === selectedDestinationId
  );

  const getDisplayName = (dest: Container | Place | Room) => {
    const fallback = destinationType ? fallbackNameByType[destinationType] : "Объект";
    const displayName = dest.name || `${fallback} #${dest.id}`;
    const typeName =
      destinationType === "container" || destinationType === "place"
        ? (dest as Container | Place).entity_type?.name
        : null;
    return typeName ? `${displayName} (${typeName})` : displayName;
  };

  return (
    <FieldGroup>
      <Field>
        <FieldLabel>{label}</FieldLabel>
        <div className="flex flex-wrap gap-2">
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
      </Field>

      {destinationType && (
        <Field>
          <FieldLabel htmlFor={`${id}-combobox`}>
            {`Выберите ${destinationLabel}`}
          </FieldLabel>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              render={
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
              }
              nativeButton={false}
            />
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command>
                <CommandInput placeholder={`Поиск ${destinationLabel}...`} />
                <CommandList>
                  {isLoading ? (
                    <div className="p-2 space-y-2">
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
        </Field>
      )}
    </FieldGroup>
  );
};

export default LocationCombobox;
