import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReactNode } from "react";
import { EntityPhoto } from "./entity-photo";

interface EntityHeaderProps {
  id: number;
  name: string | null;
  photoUrl: string | null;
  isDeleted: boolean;
  defaultIcon: ReactNode;
  defaultName: string;
  actions?: ReactNode;
  showId?: boolean;
  layout?: "default" | "compact";
}

export const EntityHeader = ({
  id,
  name,
  photoUrl,
  isDeleted,
  defaultIcon,
  defaultName,
  actions,
  showId = true,
  layout = "default",
}: EntityHeaderProps) => {
  const displayName = name || `${defaultName} #${id}`;

  if (layout === "compact") {
    return (
      <CardHeader>
        <div className="flex flex-wrap items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1 shrink-0 basis-full sm:basis-0">
            <EntityPhoto
              photoUrl={photoUrl}
              name={displayName}
              defaultIcon={defaultIcon}
              size="small"
            />
            <div className="min-w-0 flex-1 overflow-hidden">
              <CardTitle className="text-xl sm:text-2xl truncate" title={displayName}>
                {displayName}
              </CardTitle>
              <CardDescription className="mt-1">
                {showId && <span>ID: #{id}</span>}
                {isDeleted && (
                  <Badge variant="destructive" className="ml-2">
                    Удалено
                  </Badge>
                )}
              </CardDescription>
            </div>
          </div>
          {actions != null && (
            <div className="flex flex-shrink-0 items-center">
              {actions}
            </div>
          )}
        </div>
      </CardHeader>
    );
  }

  return (
    <CardHeader>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <EntityPhoto
            photoUrl={photoUrl}
            name={displayName}
            defaultIcon={defaultIcon}
            size="medium"
          />
          <div className="flex-1">
            <CardTitle className="text-2xl">{displayName}</CardTitle>
            <CardDescription className="mt-1 flex items-center gap-2 flex-wrap">
              {showId && <span>ID: #{id}</span>}
              {isDeleted && (
                <>
                  {showId && <span className="text-muted-foreground">•</span>}
                  <Badge variant="destructive">Удалено</Badge>
                </>
              )}
            </CardDescription>
          </div>
        </div>
        {actions != null && actions}
      </div>
    </CardHeader>
  );
};
