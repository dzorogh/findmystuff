"use client";

import { Sofa, Box, FileText, Monitor } from "lucide-react";
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
    <div className="flex w-full flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both pt-2">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
        Примеры запросов
      </p>
      <div className="flex w-full max-w-lg flex-wrap items-center justify-center gap-2">
        {suggestions.map((suggestion) => {
          const Icon = suggestion.icon;
          return (
            <Button
              key={suggestion.label}
              variant="outline"
              size="sm"
              className="h-10 rounded-full px-5 text-sm bg-background/50 backdrop-blur transition-all hover:scale-105 hover:bg-muted text-muted-foreground hover:text-foreground"
              onClick={() => onSuggest(suggestion.label)}
            >
              <Icon className="mr-2 h-4 w-4 opacity-70" />
              {suggestion.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
