"use client";

import { useState } from "react";
import ContainersList from "@/components/lists/containers-list";
import AddContainerForm from "@/components/forms/add-container-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container, Plus, Filter } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { CompactSearchBar } from "@/components/common/compact-search-bar";

export default function ContainersPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [resultsCount, setResultsCount] = useState(0);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const handleContainerAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchStateChange = (state: { isSearching: boolean; resultsCount: number }) => {
    setIsSearching(state.isSearching);
    setResultsCount(state.resultsCount);
  };

  return (
    <div className="container mx-auto pb-10 pt-4 px-4 md:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          icon={Container}
          title="Контейнеры"
          description="Просмотр и поиск всех контейнеров в складе"
          action={
            <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Добавить контейнер
            </Button>
          }
        />
        <CompactSearchBar
          placeholder="Название, тип или маркировка (КОР-001)..."
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          isSearching={isSearching}
          resultsCount={resultsCount}
          resultsLabel={{ singular: "контейнер", plural: "контейнеров" }}
          actions={
            <Button
              variant="outline"
              size="default"
              onClick={() => setIsFiltersOpen(true)}
              className={activeFiltersCount > 0 ? "border-primary" : ""}
            >
              <Filter className="h-4 w-4 mr-2" />
              Фильтры
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          }
        />
        <ContainersList 
          refreshTrigger={refreshTrigger}
          searchQuery={searchQuery}
          onSearchStateChange={handleSearchStateChange}
          filtersOpen={isFiltersOpen}
          onFiltersOpenChange={setIsFiltersOpen}
          onActiveFiltersCountChange={setActiveFiltersCount}
        />
        <AddContainerForm
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSuccess={handleContainerAdded}
        />
      </div>
    </div>
  );
}
