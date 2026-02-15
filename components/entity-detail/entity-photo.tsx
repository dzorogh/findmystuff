import Image from "next/image";
import { ReactNode } from "react";

interface EntityPhotoProps {
  photoUrl: string | null;
  name: string;
  defaultIcon: ReactNode;
  size?: "small" | "medium" | "large";
}

const sizeClasses = {
  small: "h-16 w-16 sm:h-20 sm:w-20",
  medium: "w-24 h-24",
  large: "w-full aspect-square max-w-md",
};

export const EntityPhoto = ({
  photoUrl,
  name,
  defaultIcon,
  size = "medium",
}: EntityPhotoProps) => {
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
