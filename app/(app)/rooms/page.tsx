"use client";

import { Suspense } from "react";
import RoomsList from "@/components/lists/rooms-list";
import AddRoomForm from "@/components/forms/add-room-form";
import { EntityListToolbar } from "@/components/common/entity-list-toolbar";
import { useEntityListPageState } from "@/lib/app/hooks/use-entity-list-page";

const RoomsPageContent = () => {
  const {
    refreshTrigger,
    searchQuery,
    isSearching,
    resultsCount,
    isFiltersOpen,
    setIsFiltersOpen,
    activeFiltersCount,
    setActiveFiltersCount,
    sort,
    setSort,
    isAddDialogOpen,
    handleEntityAdded,
    handleAddDialogOpenChange,
    handleSearchChange,
    handleSearchStateChange,
  } = useEntityListPageState();

  return (
    <div className="space-y-4">
        <EntityListToolbar
          placeholder="Введите название помещения..."
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          isSearching={isSearching}
          resultsCount={resultsCount}
          resultsLabel={{ singular: "помещение", plural: "помещений" }}
          activeFiltersCount={activeFiltersCount}
          onOpenFilters={() => setIsFiltersOpen(true)}
          sort={sort}
          onSortChange={setSort}
        />
        <RoomsList 
          refreshTrigger={refreshTrigger}
          searchQuery={searchQuery}
          sort={sort}
          onSearchStateChange={handleSearchStateChange}
          filtersOpen={isFiltersOpen}
          onFiltersOpenChange={setIsFiltersOpen}
          onActiveFiltersCountChange={setActiveFiltersCount}
        />
        <AddRoomForm
          open={isAddDialogOpen}
          onOpenChange={handleAddDialogOpenChange}
          onSuccess={handleEntityAdded}
        />
    </div>
  );
};

const RoomsPage = () => {
  return (
    <Suspense fallback={null}>
      <RoomsPageContent />
    </Suspense>
  );
};

export default RoomsPage;
