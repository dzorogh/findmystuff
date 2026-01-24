"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import RoomsList from "@/components/lists/rooms-list";
import AddRoomForm from "@/components/forms/add-room-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";
import { CompactSearchBar } from "@/components/common/compact-search-bar";

const RoomsPageContent = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [resultsCount, setResultsCount] = useState(0);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shouldOpenCreateForm = searchParams.get("create") === "1";

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

  useEffect(() => {
    if (shouldOpenCreateForm) {
      setIsAddDialogOpen(true);
    }
  }, [shouldOpenCreateForm]);

  return (
    <div className="container mx-auto pb-10 pt-4 px-4 md:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
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
              <Filter className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Фильтры</span>
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
        />
        <AddRoomForm
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open && shouldOpenCreateForm) {
              const params = new URLSearchParams(searchParams.toString());
              params.delete("create");
              const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
              router.replace(nextUrl, { scroll: false });
            }
          }}
          onSuccess={handleRoomAdded}
        />
      </div>
    </div>
  );
};

const RoomsPage = () => {
  return (
    <Suspense fallback={<div className="container mx-auto pb-10 pt-4 px-4 md:py-10" />}>
      <RoomsPageContent />
    </Suspense>
  );
};

export default RoomsPage;
