"use client";

import { Suspense } from "react";
import ItemsList from "@/components/lists/items-list";
import AddItemForm from "@/components/forms/add-item-form";
import { EntityListToolbar } from "@/components/common/entity-list-toolbar";
import { useEntityListPageState } from "@/lib/app/hooks/use-entity-list-page";
import { PageHeader } from "@/components/layout/page-header";

const ItemsPageContent = () => {
  const {
    refreshTrigger,
    searchQuery,
    isSearching,
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
      <PageHeader title="Вещи" />
      <EntityListToolbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        isSearching={isSearching}
        activeFiltersCount={activeFiltersCount}
        onOpenFilters={() => setIsFiltersOpen(true)}
        sort={sort}
        onSortChange={setSort}
      />
      <ItemsList
        refreshTrigger={refreshTrigger}
        searchQuery={searchQuery}
        sort={sort}
        onSearchStateChange={handleSearchStateChange}
        filtersOpen={isFiltersOpen}
        onFiltersOpenChange={setIsFiltersOpen}
        onActiveFiltersCountChange={setActiveFiltersCount}
      />
      <AddItemForm
        open={isAddDialogOpen}
        onOpenChange={handleAddDialogOpenChange}
        onSuccess={handleEntityAdded}
      />
    </div>
  );
};

const ItemsPage = () => {
  return (
    <Suspense fallback={null}>
      <ItemsPageContent />
    </Suspense>
  );
};

export default ItemsPage;
