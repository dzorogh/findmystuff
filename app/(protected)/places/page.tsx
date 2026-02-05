"use client";

import { Suspense } from "react";
import PlacesList from "@/components/lists/places-list";
import AddPlaceForm from "@/components/forms/add-place-form";
import { EntityListToolbar } from "@/components/common/entity-list-toolbar";
import { useEntityListPageState } from "@/lib/app/hooks/use-entity-list-page";

const PlacesPageContent = () => {
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
          placeholder="Название, тип или маркировка (Ш1)..."
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          isSearching={isSearching}
          resultsCount={resultsCount}
          resultsLabel={{ singular: "место", plural: "мест" }}
          activeFiltersCount={activeFiltersCount}
          onOpenFilters={() => setIsFiltersOpen(true)}
          sort={sort}
          onSortChange={setSort}
        />
        <PlacesList 
          refreshTrigger={refreshTrigger}
          searchQuery={searchQuery}
          sort={sort}
          onSearchStateChange={handleSearchStateChange}
          filtersOpen={isFiltersOpen}
          onFiltersOpenChange={setIsFiltersOpen}
          onActiveFiltersCountChange={setActiveFiltersCount}
        />
        <AddPlaceForm
          open={isAddDialogOpen}
          onOpenChange={handleAddDialogOpenChange}
          onSuccess={handleEntityAdded}
        />
    </div>
  );
};

const PlacesPage = () => {
  return (
    <Suspense fallback={null}>
      <PlacesPageContent />
    </Suspense>
  );
};

export default PlacesPage;
