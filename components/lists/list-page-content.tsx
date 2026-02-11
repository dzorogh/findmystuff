import { useListPage } from "@/lib/app/hooks/use-list-page";
import { PageHeader } from "../layout/page-header";
import { Button } from "../ui/button";
import { EntityList } from "./entity-list";
import { Plus } from "lucide-react";
import { ListPagination } from "./list-pagination";
import type { EntityActionsCallbacks } from "@/components/entity-detail/entity-actions";
import type { EntityDisplay } from "@/lib/app/types/entity-config";

export function ListPageContent({
  listPage,
  getRowActions,
}: {
  listPage: ReturnType<typeof useListPage>;
  getRowActions: (entity: EntityDisplay) => EntityActionsCallbacks;
}) {
  const addForm = listPage.addForm;
  const AddForm = addForm?.form ?? null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={listPage.labels.plural}
        actions={
          addForm ? (
            <Button
              variant="default"
              onClick={() => listPage.handleAddFormOpenChange?.(true)}
            >
              <Plus data-icon="inline-start" /> {addForm.title}
            </Button>
          ) : null
        }
      />
      <EntityList
        data={listPage.data}
        isLoading={listPage.isLoading}
        error={listPage.error}
        searchQuery={listPage.searchQuery}
        onSearchChange={listPage.handleSearchChange}
        sort={listPage.sort}
        onSortChange={listPage.setSort}
        filters={listPage.filters}
        onFiltersChange={listPage.setFilters}
        isFiltersOpen={listPage.isFiltersOpen}
        onFiltersOpenChange={listPage.setIsFiltersOpen}
        activeFiltersCount={listPage.activeFiltersCount}
        resultsCount={listPage.resultsCount}
        results={listPage.results}
        filterFields={listPage.filterFields}
        columns={listPage.columns}
        actions={listPage.actions}
        icon={listPage.icon}
        getName={listPage.getName}
        getRowActions={getRowActions}
      />
      {listPage.pagination &&
        listPage.pagination.totalCount > listPage.pagination.pageSize && (
          <ListPagination
            currentPage={listPage.pagination.currentPage}
            totalPages={listPage.pagination.totalPages}
            onPageChange={listPage.pagination.goToPage}
          />
        )}
      {AddForm && (
        <AddForm
          open={listPage.isAddFormOpen ?? false}
          onOpenChange={listPage.handleAddFormOpenChange ?? (() => { })}
          onSuccess={listPage.handleEntityAdded}
        />
      )}
    </div>
  );
}
