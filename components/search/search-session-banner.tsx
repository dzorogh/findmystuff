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
    <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-muted/50 via-background to-muted/20 border-border/60 shadow-sm">
      <div className="flex min-w-0 items-center gap-4">
        {mode === "image" && previewUrl && (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg shadow-sm border border-border/50">
            <Image
              src={previewUrl}
              alt="Запрос для поиска"
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
        )}
        <div className="min-w-0 space-y-1">
          <p className="text-base sm:text-lg font-medium">{statusText}</p>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <Button type="button" variant="outline" className="w-full sm:w-auto shrink-0" onClick={onReset}>
        Сбросить поиск
      </Button>
    </Card>
  );
}
