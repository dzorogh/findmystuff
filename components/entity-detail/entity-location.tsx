import { Building2, Warehouse, Container } from "lucide-react";
import { getEntityDisplayName, type LabelEntityType } from "@/lib/entities/helpers/display-name";
import type { Location } from "@/types/entity";

interface EntityLocationProps {
  location: Location | null;
  variant?: "default" | "detailed";
}

export const EntityLocation = ({ location, variant = "default" }: EntityLocationProps) => {
  if (!location) {
    return (
      <div>
        <h3 className="text-sm font-medium mb-2">Местоположение</h3>
        <p className="text-sm text-muted-foreground">Местоположение не указано</p>
      </div>
    );
  }

  const getLocationIcon = () => {
    switch (location.destination_type) {
      case "room":
        return <Building2 className="h-4 w-4 text-primary flex-shrink-0" />;
      case "place":
        return <Warehouse className="h-4 w-4 text-primary flex-shrink-0" />;
      case "container":
        return <Container className="h-4 w-4 text-primary flex-shrink-0" />;
      default:
        return null;
    }
  };

  const getLocationName = (): string => {
    if (location.destination_type && location.destination_id != null) {
      return getEntityDisplayName(
        location.destination_type as LabelEntityType,
        location.destination_id,
        location.destination_name
      );
    }
    return "Неизвестно";
  };

  if (variant === "detailed") {
    return (
      <div>
        <h3 className="text-sm font-medium mb-2">Местоположение</h3>
        {location ? (
          <div className="space-y-3">
            <div className="rounded-md border bg-muted/50 p-4 space-y-2">
              {location.destination_type === "room" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {getLocationIcon()}
                    <span>{getLocationName()}</span>
                  </div>
                </div>
              )}
              {location.destination_type === "place" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {getLocationIcon()}
                    <span>{getLocationName()}</span>
                  </div>
                  {location.room_name && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6 border-l-2 border-border pl-3">
                      <Building2 className="h-3 w-3 flex-shrink-0" />
                      <span>Помещение: {location.room_name}</span>
                    </div>
                  )}
                </div>
              )}
              {location.destination_type === "container" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {getLocationIcon()}
                    <span>{getLocationName()}</span>
                  </div>
                  {location.place_name && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6 border-l-2 border-border pl-3">
                      <Warehouse className="h-3 w-3 flex-shrink-0" />
                      <span>Место: {location.place_name}</span>
                    </div>
                  )}
                  {location.room_name && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6 border-l-2 border-border pl-3">
                      <Building2 className="h-3 w-3 flex-shrink-0" />
                      <span>Помещение: {location.room_name}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Перемещено:{" "}
              {new Date(location.moved_at).toLocaleString("ru-RU", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Местоположение не указано</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Текущее местоположение</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          {getLocationIcon()}
          <span>{getLocationName()}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Перемещен:{" "}
          {new Date(location.moved_at).toLocaleString("ru-RU", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
};
