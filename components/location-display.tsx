"use client";

import { MapPin, Container, Building2 } from "lucide-react";

interface LocationDisplayProps {
  location: {
    destination_type: string | null;
    destination_id: number | null;
    destination_name: string | null;
    place_name?: string | null;
    room_name?: string | null;
  } | null;
  className?: string;
  showLabel?: boolean;
}

const LocationDisplay = ({
  location,
  className = "",
  showLabel = false,
}: LocationDisplayProps) => {
  if (!location) {
    return (
      <span className={`text-sm text-muted-foreground ${className}`}>
        Местоположение не указано
      </span>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {location.destination_type === "room" && (
        <div className="flex items-center gap-2 text-sm">
          <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
          <span>
            {location.destination_name ||
              `Помещение #${location.destination_id}`}
          </span>
        </div>
      )}
      {location.destination_type === "place" && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
            <span>
              {location.destination_name ||
                `Место #${location.destination_id}`}
            </span>
          </div>
          {location.room_name && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6">
              <Building2 className="h-3 w-3 flex-shrink-0" />
              <span>{location.room_name}</span>
            </div>
          )}
        </div>
      )}
      {location.destination_type === "container" && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Container className="h-4 w-4 text-primary flex-shrink-0" />
            <span>
              {location.destination_name ||
                `Контейнер #${location.destination_id}`}
            </span>
          </div>
          {location.place_name && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span>{location.place_name}</span>
            </div>
          )}
          {location.room_name && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6">
              <Building2 className="h-3 w-3 flex-shrink-0" />
              <span>{location.room_name}</span>
            </div>
          )}
        </div>
      )}
      {showLabel && !location.destination_type && (
        <span className="text-sm text-muted-foreground">Не указано</span>
      )}
    </div>
  );
};

export default LocationDisplay;
