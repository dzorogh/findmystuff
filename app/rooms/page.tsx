"use client";

import { useState, Suspense } from "react";
import RoomsList from "@/components/lists/rooms-list";
import AddRoomForm from "@/components/forms/add-room-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Filter } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { CompactSearchBar } from "@/components/common/compact-search-bar";
import { useFiltersFromUrl } from "@/hooks/use-filters-from-url";
import { RoomsFilters } from "@/components/filters/rooms-filters-panel";

function RoomsPageContent() {
  const { filtersFromUrl, updateFiltersInUrl } = useFiltersFromUrl<RoomsFilters>(
    {
      showDeleted: false,
      hasItems: null,
      hasContainers: null,
      hasPlaces: null,
    },
    "rooms"
  );

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [resultsCount, setResultsCount] = useState(0);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const handleRoomAdded = () => {
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
          icon={Building2}
          title="Помещения"
          description="Просмотр и поиск всех помещений в складе"
          action={
            <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Добавить помещение
            </Button>
          }
        />
        <CompactSearchBar
          placeholder="Введите название помещения..."
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          isSearching={isSearching}
          resultsCount={resultsCount}
          resultsLabel={{ singular: "помещение", plural: "помещений" }}
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
        <RoomsList 
          refreshTrigger={refreshTrigger}
          searchQuery={searchQuery}
          onSearchStateChange={handleSearchStateChange}
          filtersOpen={isFiltersOpen}
          onFiltersOpenChange={setIsFiltersOpen}
          onActiveFiltersCountChange={setActiveFiltersCount}
          initialFilters={filtersFromUrl}
          onFiltersChange={updateFiltersInUrl}
        />
        <AddRoomForm
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSuccess={handleRoomAdded}
        />
      </div>
    </div>
  );
}

export default function RoomsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto pb-10 pt-4 px-4 md:py-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-20 bg-muted animate-pulse rounded" />
          <div className="h-10 bg-muted animate-pulse rounded" />
        </div>
      </div>
    }>
      <RoomsPageContent />
    </Suspense>
  );
}
