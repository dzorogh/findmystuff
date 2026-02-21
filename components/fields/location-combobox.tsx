"use client";

import * as React from "react";
import { LayoutGrid, Container as ContainerIcon, DoorOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
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
  const destinationLabel = destinationType ? labelByType[destinationType] : "";

  const buttonOrderOptions = [
    { type: "room" as const, label: "Помещение", icon: DoorOpen },
    { type: "place" as const, label: "Место", icon: LayoutGrid },
    { type: "container" as const, label: "Контейнер", icon: ContainerIcon },
  ];
  const buttonOrder = allowedTypes?.length
    ? buttonOrderOptions.filter((b) => allowedTypes.includes(b.type))
    : buttonOrderOptions;

  const items = React.useMemo(() => {
    const fallbackByType: Record<DestinationType, string> = {
      container: "Контейнер",
      place: "Место",
      room: "Помещение",
    };
    const fallback = destinationType ? fallbackByType[destinationType] : "Объект";
    return destinations.map((dest) => {
      const displayName = dest.name || `${fallback} #${dest.id}`;
      const typeName =
        destinationType === "container" || destinationType === "place"
          ? (dest as Container | Place).entity_type?.name
          : null;
      const label = typeName ? `${displayName} (${typeName})` : displayName;
      return { value: dest.id.toString(), label };
    });
  }, [destinations, destinationType]);

  const selectedItem =
    items.find((i) => i.value === selectedDestinationId) ?? null;

  const handleValueChange = (item: { value: string; label: string } | null) => {
    onDestinationIdChange(item?.value ?? "");
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

          <Combobox
            value={selectedItem}
            items={items}
            onValueChange={handleValueChange}
            disabled={disabled || (isLoading ? false : destinations.length === 0)}
          >
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <ComboboxInput
                id={`${id}-combobox`}
                placeholder={`Поиск ${destinationLabel}...`}
              />
            )}
            <ComboboxContent>
              <ComboboxEmpty>
                {destinationType === "container"
                  ? "Контейнеры не найдены"
                  : destinationType === "place"
                    ? "Местоположения не найдены"
                    : "Помещения не найдены"}
              </ComboboxEmpty>
              <ComboboxList>
                {(item: { value: string; label: string }) => (
                  <ComboboxItem key={item.value} value={item}>
                    {item.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
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
