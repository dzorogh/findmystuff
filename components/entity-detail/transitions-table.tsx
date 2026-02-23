import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, DoorOpen, LayoutGrid, Container, Sofa } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getEntityDisplayName, type LabelEntityType } from "@/lib/entities/helpers/display-name";
import type { Transition } from "@/types/entity";
import type { DestinationType } from "@/types/entity";

interface TransitionsTableProps {
  transitions: Transition[];
  emptyMessage?: string;
  isLoading?: boolean;
}

export const TransitionsTable = ({ transitions, emptyMessage = "История перемещений пуста", isLoading = false }: TransitionsTableProps) => {
  const getLocationIcon = (type: string | null) => {
    switch (type) {
      case "room":
        return <DoorOpen className="h-4 w-4 text-primary flex-shrink-0" />;
      case "place":
        return <LayoutGrid className="h-4 w-4 text-primary flex-shrink-0" />;
      case "container":
        return <Container className="h-4 w-4 text-primary flex-shrink-0" />;
      case "furniture":
        return <Sofa className="h-4 w-4 text-primary flex-shrink-0" />;
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

  const getDestinationHref = (transition: Transition): string | null => {
    if (!transition.destination_type || transition.destination_id == null) return null;
    const type = transition.destination_type as DestinationType;
    const id = transition.destination_id;
    switch (type) {
      case "room":
        return `/rooms/${id}`;
      case "place":
        return `/places/${id}`;
      case "container":
        return `/containers/${id}`;
      case "furniture":
        return `/furniture/${id}`;
      default:
        return null;
    }
  };

  const renderLocationName = (transition: Transition) => {
    const name = getLocationName(transition);
    const href = getDestinationHref(transition);
    if (href) {
      return (
        <Link
          href={href}
          className="transition-colors hover:text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {name}
        </Link>
      );
    }
    return <span>{name}</span>;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }

  if (transitions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
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
            <TableCell className="flex items-start gap-2">
              <div className="space-y-1">
                {(transition.destination_type === "room" || transition.destination_type === "furniture") && (
                  <div className="flex items-center gap-2 text-sm">
                    {getLocationIcon(transition.destination_type)}
                    {renderLocationName(transition)}
                  </div>
                )}
                {transition.destination_type === "place" && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      {getLocationIcon(transition.destination_type)}
                      {renderLocationName(transition)}
                    </div>
                    {transition.room_name && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6">
                        <DoorOpen className="h-3 w-3 flex-shrink-0" />
                        <span>{transition.room_name}</span>
                      </div>
                    )}
                  </div>
                )}
                {transition.destination_type === "container" && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      {getLocationIcon(transition.destination_type)}
                      {renderLocationName(transition)}
                    </div>
                    {transition.place_name && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6">
                        <LayoutGrid className="h-3 w-3 flex-shrink-0" />
                        <span>{transition.place_name}</span>
                      </div>
                    )}
                    {transition.room_name && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6">
                        <DoorOpen className="h-3 w-3 flex-shrink-0" />
                        <span>{transition.room_name}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {index === 0 && (
                <Badge variant="default">
                  Текущее
                </Badge>
              )}
            </TableCell>
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
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
