import { useListPage } from "@/lib/app/hooks/use-list-page";
import { PageHeader } from "../layout/page-header";
import { Button } from "../ui/button";
import { EntityList } from "./entity-list";
import { Plus } from "lucide-react";
import { ListPagination } from "./list-pagination";
import type { EntityActionsCallbacks } from "@/lib/entities/components/entity-actions";
import type { Item, Room, Place, Container } from "@/types/entity";

export function ListPageContent<TFilters extends { showDeleted: boolean }>({
    listPage,
    getRowActions,
}: {
    listPage: ReturnType<typeof useListPage<TFilters>>;
    getRowActions: (entity: Item | Room | Place | Container) => EntityActionsCallbacks;
}) {
    const addConfig = listPage.addFormConfig;
    const AddForm = addConfig && typeof addConfig === "object" ? addConfig.form : null;

    return (
        <div className="flex flex-col gap-4">
            <PageHeader
                title="Вещи"
                actions={
                    <Button variant="default" size="sm" onClick={() => listPage.handleAddFormOpenChange?.(true)}>
                        <Plus data-icon="inline-start" /> {addConfig && typeof addConfig === "object" ? addConfig.title : ""}
                    </Button>
                } />
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
                resultsLabel={listPage.resultsLabel}
                filterConfig={listPage.filterConfig}
                columnsConfig={listPage.columnsConfig}
                actionsConfig={listPage.actionsConfig}
                listIcon={listPage.listIcon}
                getListDisplayName={listPage.getListDisplayName}
                getRowActions={getRowActions}
            />
            {listPage.totalCount != null &&
                listPage.itemsPerPage != null &&
                listPage.totalPages != null &&
                listPage.currentPage != null &&
                listPage.goToPage != null &&
                listPage.totalCount > listPage.itemsPerPage && (
                    <ListPagination
                        currentPage={listPage.currentPage}
                        totalPages={listPage.totalPages}
                        onPageChange={listPage.goToPage}
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