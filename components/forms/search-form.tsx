"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";

interface SearchFormProps {
  title: string;
  description: string;
  placeholder: string;
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSearching: boolean;
  resultsCount: number;
  resultsLabel: {
    singular: string;
    plural: string;
  };
  showDeleted: boolean;
  onToggleDeleted: () => void;
}

export const SearchForm = ({
  title,
  description,
  placeholder,
  searchQuery,
  onSearchChange,
  isSearching,
  resultsCount,
  resultsLabel,
  showDeleted,
  onToggleDeleted,
}: SearchFormProps) => {
  const getResultsText = () => {
    if (resultsCount === 1) {
      return resultsLabel.singular;
    }
    return resultsLabel.plural;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={onSearchChange}
            placeholder={placeholder}
            className="pl-10"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          {searchQuery && (
            <p className="text-sm text-muted-foreground">
              Найдено: {resultsCount} {getResultsText()}
            </p>
          )}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant={showDeleted ? "default" : "outline"}
              size="sm"
              onClick={onToggleDeleted}
              className="flex-1 sm:flex-initial"
            >
              {showDeleted ? "Скрыть удаленные" : "Показать удаленные"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
