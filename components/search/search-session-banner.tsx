"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SearchMode } from "@/lib/search/types";

interface SearchSessionBannerProps {
  mode: SearchMode;
  previewUrl?: string | null;
  statusText: string;
  description: string;
  onReset: () => void;
}

export function SearchSessionBanner({
  mode,
  previewUrl,
  statusText,
  description,
  onReset,
}: SearchSessionBannerProps) {
  return (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        {mode === "image" && previewUrl && (
          <div className="relative h-16 w-16 overflow-hidden rounded-md border bg-muted">
            <Image
              src={previewUrl}
              alt="Запрос для поиска"
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
        )}
        <div className="min-w-0">
          <p className="font-medium">{statusText}</p>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <Button type="button" variant="outline" onClick={onReset}>
        Сбросить поиск
      </Button>
    </Card>
  );
}
