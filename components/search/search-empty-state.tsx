"use client";

import type { LucideIcon } from "lucide-react";
import { Sofa, Box, FileText, Monitor, Shirt, Wrench, Archive, Lamp } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchEmptyStateProps {
  onSuggest: (query: string) => void;
}

const suggestions: { label: string; icon: LucideIcon }[] = [
  { label: "Зимняя куртка", icon: Shirt },
  { label: "Шуруповёрт", icon: Wrench },
  { label: "Ноутбук Lenovo", icon: Monitor },
  { label: "Паспорт", icon: FileText },
  { label: "Настольная лампа", icon: Lamp },
  { label: "Коробка с книгами", icon: Archive },
  { label: "Диван угловой", icon: Sofa },
  { label: "Зимняя резина", icon: Box },
];

export function SearchEmptyState({ onSuggest }: SearchEmptyStateProps) {
  return (
    <div className="flex w-full flex-col items-center gap-5 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
      <div className="flex w-full max-w-2xl items-center gap-3 px-1">
        <div className="h-px min-w-[1rem] flex-1 bg-gradient-to-r from-transparent to-border/70" />
        <p className="shrink-0 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground/75">
          Примеры запросов
        </p>
        <div className="h-px min-w-[1rem] flex-1 bg-gradient-to-l from-transparent to-border/70" />
      </div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-3 sm:gap-y-2">
        {suggestions.map((suggestion) => {
          const Icon = suggestion.icon;
          return (
            <button
              key={suggestion.label}
              type="button"
              className={cn(
                "group touch-manipulation flex w-full items-center gap-3 rounded-full border border-border/55 bg-background/45 px-3 py-2.5 text-left shadow-sm backdrop-blur-sm",
                "transition-[border-color,background-color,box-shadow] duration-200",
                "hover:border-primary/40 hover:bg-muted/35 hover:shadow-md",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )}
              onClick={() => onSuggest(suggestion.label)}
              aria-label={`Искать: ${suggestion.label}`}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary/[0.18]"
                aria-hidden
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-foreground">
                {suggestion.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
