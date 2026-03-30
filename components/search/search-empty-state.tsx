"use client";

import { PackageSearch, Sofa, Box, FileText, Monitor } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SearchEmptyStateProps {
  onSuggest: (query: string) => void;
}

const suggestions = [
  { label: "Коробки", icon: Box },
  { label: "Мебель", icon: Sofa },
  { label: "Техника", icon: Monitor },
  { label: "Документы", icon: FileText },
];

export function SearchEmptyState({ onSuggest }: SearchEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      <div className="relative mb-6">
        <div className="absolute inset-0 -m-4 rounded-full bg-primary/5 blur-2xl" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border bg-background/50 shadow-sm backdrop-blur">
          <PackageSearch className="h-10 w-10 text-primary/60" />
        </div>
      </div>
      
      <h2 className="mb-2 text-2xl font-semibold tracking-tight">Поиск вещей</h2>
      <p className="mb-8 max-w-sm text-balance text-sm text-muted-foreground">
        Начните вводить название вещи или контейнера, либо воспользуйтесь поиском по фото для быстрого нахождения.
      </p>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
          Популярные категории
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {suggestions.map((suggestion) => {
            const Icon = suggestion.icon;
            return (
              <Button
                key={suggestion.label}
                variant="outline"
                size="sm"
                className="h-9 rounded-full px-4 text-xs bg-background/50 backdrop-blur transition-all hover:scale-105 hover:bg-muted"
                onClick={() => onSuggest(suggestion.label)}
              >
                <Icon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                {suggestion.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
