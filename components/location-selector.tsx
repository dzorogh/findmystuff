"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { MapPin, Container, Building2 } from "lucide-react";
import { useRooms } from "@/hooks/use-rooms";
import { usePlaces } from "@/hooks/use-places";
import { useContainers } from "@/hooks/use-containers";

interface LocationSelectorProps {
  destinationType: "room" | "place" | "container" | null;
  selectedDestinationId: string;
  onDestinationTypeChange: (type: "room" | "place" | "container" | null) => void;
  onDestinationIdChange: (id: string) => void;
  disabled?: boolean;
  showRoomFirst?: boolean;
  label?: string;
  id?: string;
}

const LocationSelector = ({
  destinationType,
  selectedDestinationId,
  onDestinationTypeChange,
  onDestinationIdChange,
  disabled = false,
  showRoomFirst = true,
  label = "Местоположение (необязательно)",
  id = "location-selector",
}: LocationSelectorProps) => {
  const { rooms } = useRooms();
  const { places } = usePlaces();
  const { containers } = useContainers();

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
        { type: "container" as const, label: "Контейнер", icon: Container },
      ]
    : [
        { type: "place" as const, label: "Место", icon: MapPin },
        { type: "container" as const, label: "Контейнер", icon: Container },
        { type: "room" as const, label: "Помещение", icon: Building2 },
      ];

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="space-y-2">
        <Label>{label}</Label>
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
              }}
              disabled={disabled}
            >
              <Icon className="mr-2 h-4 w-4" />
              {btnLabel}
            </Button>
          ))}
        </div>
      </div>

      {destinationType && (
        <div className="space-y-2">
          <Label htmlFor={`${id}-select`}>Выберите {destinationLabel}</Label>
          <Select
            id={`${id}-select`}
            value={selectedDestinationId}
            onChange={(e) => onDestinationIdChange(e.target.value)}
            disabled={disabled || destinations.length === 0}
          >
            <option value="">-- Выберите {destinationLabel} --</option>
            {destinations.map((dest) => (
              <option key={dest.id} value={dest.id}>
                {dest.name ||
                  `${destinationType === "container" ? "Контейнер" : destinationType === "place" ? "Место" : "Помещение"} #${dest.id}`}
              </option>
            ))}
          </Select>
          {destinations.length === 0 && (
            <p className="text-xs text-muted-foreground">
              {destinationType === "container"
                ? "Контейнеры не найдены"
                : destinationType === "place"
                ? "Местоположения не найдены"
                : "Помещения не найдены"}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
