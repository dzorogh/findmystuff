import Link from "next/link";
import { Package, Container, LayoutGrid, DoorOpen, Sofa } from "lucide-react";

interface EntityContentListItem {
  id: number;
  name: string | null;
  photo_url?: string | null;
}

interface EntityContentListProps {
  items: EntityContentListItem[];
  entityType: "items" | "containers" | "places" | "rooms" | "furniture";
  emptyMessage: string;
}

const entityIcons = {
  items: Package,
  containers: Container,
  places: LayoutGrid,
  rooms: DoorOpen,
  furniture: Sofa,
};

const entityNameFallback: Record<typeof entityIcons extends Record<infer K, unknown> ? K : never, string> = {
  items: "Вещь",
  containers: "Контейнер",
  places: "Место",
  rooms: "Помещение",
  furniture: "Мебель",
};

export function EntityContentList({
  items,
  entityType,
  emptyMessage,
}: EntityContentListProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        {emptyMessage}
      </p>
    );
  }

  const Icon = entityIcons[entityType];
  const fallbackName = entityNameFallback[entityType];
  const hrefPrefix = `/${entityType}`;

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => {
        const displayName = item.name ?? `${fallbackName} #${item.id}`;
        return (
          <Link
            key={item.id}
            href={`${hrefPrefix}/${item.id}`}
            className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
          >
            {item.photo_url ? (
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.photo_url}
                  alt={displayName}
                  className="h-full w-full object-cover"
                  width={48}
                  height={48}
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded border bg-muted">
                <Icon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="font-medium truncate block">{displayName}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
