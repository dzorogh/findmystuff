import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Container, Warehouse } from "lucide-react";

interface EntityItem {
  id: number;
  name: string | null;
  photo_url: string | null;
  created_at: string;
}

interface EntityContentGridProps {
  items: EntityItem[];
  emptyMessage: string;
  entityType: "items" | "containers" | "places";
  title?: string;
}

const entityIcons = {
  items: Package,
  containers: Container,
  places: Warehouse,
};

export const EntityContentGrid = ({
  items,
  emptyMessage,
  entityType,
  title,
}: EntityContentGridProps) => {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        {emptyMessage}
      </p>
    );
  }

  const Icon = entityIcons[entityType];
  const entityName = entityType === "items" ? "Вещь" : entityType === "containers" ? "Контейнер" : "Место";
  const hrefPrefix = `/${entityType}`;

  return (
    <div className="space-y-6">
      {title && (
        <h4 className="text-sm font-medium mb-3">
          {title} ({items.length})
        </h4>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`${hrefPrefix}/${item.id}`}
            className="group"
          >
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center space-y-2">
                  {item.photo_url ? (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                      <Image
                        src={item.photo_url}
                        alt={item.name || `${entityName} #${item.id}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-lg border bg-muted flex items-center justify-center">
                      <Icon className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <div className="w-full">
                    <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                      {item.name || `${entityName} #${item.id}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ID: #{item.id}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
