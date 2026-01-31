import Image from "next/image";
import { ReactNode } from "react";

interface EntityPhotoProps {
  photoUrl: string | null;
  name: string;
  defaultIcon: ReactNode;
  size?: "small" | "medium" | "large";
  aspectRatio?: "square" | "video";
}

const sizeClasses = {
  small: "h-16 w-16 sm:h-20 sm:w-20",
  medium: "w-24 h-24",
  large: "w-full aspect-video",
};

export const EntityPhoto = ({
  photoUrl,
  name,
  defaultIcon,
  size = "medium",
  aspectRatio = "square",
}: EntityPhotoProps) => {
  if (aspectRatio === "video") {
    return (
      <div>
        <h3 className="text-sm font-medium mb-2">Фотография</h3>
        {photoUrl ? (
          <div className="w-full aspect-video rounded-lg overflow-hidden border border-border bg-muted">
            <Image
              src={photoUrl}
              alt={name}
              width={800}
              height={450}
              className="w-full h-full object-cover"
              unoptimized={photoUrl.includes("storage.supabase.co")}
            />
          </div>
        ) : (
          <div className="w-full aspect-video rounded-lg border-2 border-dashed border-border bg-muted/50 flex items-center justify-center">
            <div className="text-center space-y-2">
              {defaultIcon}
              <p className="text-sm text-muted-foreground">Фотография не загружена</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (photoUrl) {
    if (size === "small") {
      return (
        <div className={`relative ${sizeClasses[size]} flex-shrink-0 rounded-lg overflow-hidden border border-border`}>
          <Image
            src={photoUrl}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 64px, 80px"
          />
        </div>
      );
    }
    return (
      <div className="flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- dynamic S3 URL, next/image not used */}
        <img
          src={photoUrl}
          alt={name}
          className={`${sizeClasses[size]} object-cover rounded-lg border`}
        />
      </div>
    );
  }

  return (
    <div className={`flex-shrink-0 ${sizeClasses[size]} rounded-lg border bg-muted flex items-center justify-center`}>
      {defaultIcon}
    </div>
  );
};
