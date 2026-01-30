import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Building2, MapPin, Container } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getEntityDisplayName, type LabelEntityType } from "@/lib/entity-display-name";
import type { Transition } from "@/types/entity";

interface TransitionsTableProps {
  transitions: Transition[];
  emptyMessage?: string;
  isLoading?: boolean;
}

export const TransitionsTable = ({ transitions, emptyMessage = "История перемещений пуста", isLoading = false }: TransitionsTableProps) => {
  const getLocationIcon = (type: string | null) => {
    switch (type) {
      case "room":
        return <Building2 className="h-4 w-4 text-primary flex-shrink-0" />;
      case "place":
        return <MapPin className="h-4 w-4 text-primary flex-shrink-0" />;
      case "container":
        return <Container className="h-4 w-4 text-primary flex-shrink-0" />;
      default:
        return null;
    }
  };

  const getLocationName = (transition: Transition): string => {
    if (transition.destination_type && transition.destination_id != null) {
      return getEntityDisplayName(
        transition.destination_type as LabelEntityType,
        transition.destination_id,
        transition.destination_name ?? null
      );
    }
    return "Неизвестно";
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }

  if (transitions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        {emptyMessage}
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Дата и время</TableHead>
          <TableHead>Местоположение</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transitions.map((transition, index) => (
          <TableRow key={transition.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {new Date(transition.created_at).toLocaleString("ru-RU", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {index === 0 && (
                  <Badge variant="default" className="ml-2">
                    Текущее
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                {transition.destination_type === "room" && (
                  <div className="flex items-center gap-2 text-sm">
                    {getLocationIcon(transition.destination_type)}
                    <span>{getLocationName(transition)}</span>
                  </div>
                )}
                {transition.destination_type === "place" && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      {getLocationIcon(transition.destination_type)}
                      <span>{getLocationName(transition)}</span>
                    </div>
                    {transition.room_name && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6">
                        <Building2 className="h-3 w-3 flex-shrink-0" />
                        <span>{transition.room_name}</span>
                      </div>
                    )}
                  </div>
                )}
                {transition.destination_type === "container" && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      {getLocationIcon(transition.destination_type)}
                      <span>{getLocationName(transition)}</span>
                    </div>
                    {transition.place_name && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span>{transition.place_name}</span>
                      </div>
                    )}
                    {transition.room_name && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6">
                        <Building2 className="h-3 w-3 flex-shrink-0" />
                        <span>{transition.room_name}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
