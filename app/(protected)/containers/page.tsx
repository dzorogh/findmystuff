"use client";

import { Suspense } from "react";
import ContainersList from "@/components/lists/containers-list";
import AddContainerForm from "@/components/forms/add-container-form";
import { EntityListToolbar } from "@/components/common/entity-list-toolbar";
import { useEntityListPageState } from "@/lib/app/hooks/use-entity-list-page";

const ContainersPageContent = () => {
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
          placeholder="Название, тип или маркировка (КОР-001)..."
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          isSearching={isSearching}
          resultsCount={resultsCount}
          resultsLabel={{ singular: "контейнер", plural: "контейнеров" }}
          activeFiltersCount={activeFiltersCount}
          onOpenFilters={() => setIsFiltersOpen(true)}
          sort={sort}
          onSortChange={setSort}
        />
        <ContainersList 
          refreshTrigger={refreshTrigger}
          searchQuery={searchQuery}
          sort={sort}
          onSearchStateChange={handleSearchStateChange}
          filtersOpen={isFiltersOpen}
          onFiltersOpenChange={setIsFiltersOpen}
          onActiveFiltersCountChange={setActiveFiltersCount}
        />
        <AddContainerForm
          open={isAddDialogOpen}
          onOpenChange={handleAddDialogOpenChange}
          onSuccess={handleEntityAdded}
        />
    </div>
  );
};

const ContainersPage = () => {
  return (
    <Suspense fallback={null}>
      <ContainersPageContent />
    </Suspense>
  );
};

export default ContainersPage;
