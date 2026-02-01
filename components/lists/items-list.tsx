"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getItems } from "@/lib/entities/api";
import { softDeleteApi } from "@/lib/shared/api/soft-delete";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Building2, ArrowRightLeft, MoreHorizontal, RotateCcw, Printer, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import MoveItemForm from "@/components/forms/move-item-form";
import { useListState } from "@/lib/app/hooks/use-list-state";
import { useDebouncedSearch } from "@/lib/app/hooks/use-debounced-search";
import { ListSkeleton } from "@/components/common/list-skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorCard } from "@/components/common/error-card";
import { ListActions } from "@/components/common/list-actions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ItemsFiltersPanel, type ItemsFilters } from "@/components/filters/items-filters-panel";
import { toast } from "sonner";
import { usePrintEntityLabel } from "@/lib/entities/hooks/use-print-entity-label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Item {
  id: number;
  name: string | null;
  created_at: string;
  deleted_at: string | null;
  photo_url: string | null;
  item_type_id?: number | null;
  item_type?: { name: string } | null;
  last_location?: {
    destination_type: string | null;
    destination_id: number | null;
    moved_at: string;
    room_name?: string | null;
    room_id?: number | null;
  } | null;
}

interface ItemsListProps {
  refreshTrigger?: number;
  searchQuery?: string;
  showDeleted?: boolean;
  onSearchStateChange?: (state: { isSearching: boolean; resultsCount: number }) => void;
  onFiltersOpenChange?: (open: boolean) => void;
  filtersOpen?: boolean;
  onActiveFiltersCountChange?: (count: number) => void;
}

const ItemsList = ({ refreshTrigger, searchQuery: externalSearchQuery, showDeleted: externalShowDeleted, onSearchStateChange, onFiltersOpenChange, filtersOpen: externalFiltersOpen, onActiveFiltersCountChange }: ItemsListProps = {}) => {
  const [internalShowDeleted, setInternalShowDeleted] = useState(externalShowDeleted || false);
  const [internalFiltersOpen, setInternalFiltersOpen] = useState(false);
  
  const isFiltersOpen = externalFiltersOpen !== undefined ? externalFiltersOpen : internalFiltersOpen;
  const setIsFiltersOpen = useCallback((open: boolean) => {
    if (externalFiltersOpen === undefined) {
      setInternalFiltersOpen(open);
    }
    onFiltersOpenChange?.(open);
  }, [externalFiltersOpen, onFiltersOpenChange]);
  
  useEffect(() => {
    if (externalShowDeleted !== undefined) {
      setInternalShowDeleted(externalShowDeleted);
      setFilters((prev) => ({ ...prev, showDeleted: externalShowDeleted }));
    }
  }, [externalShowDeleted]);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, showDeleted: internalShowDeleted }));
  }, [internalShowDeleted]);

  const [filters, setFilters] = useState<ItemsFilters>({
    showDeleted: internalShowDeleted,
    locationType: null,
    hasPhoto: null,
    roomId: null,
  });

  const {
    user,
    isUserLoading,
    isLoading,
    isSearching,
    error,
    searchQuery,
    showDeleted,
    setError: _setError,
    startLoading,
    finishLoading,
    handleError,
  } = useListState({
    externalSearchQuery,
    externalShowDeleted: filters.showDeleted,
    refreshTrigger,
    onSearchStateChange,
  });

  const [items, setItems] = useState<Item[]>([]);
  const [movingItemId, setMovingItemId] = useState<number | null>(null);
  const router = useRouter();
  const [mobileActionsItemId, setMobileActionsItemId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  const getRoomLabel = (location: Item["last_location"]) => {
    if (!location) {
      return null;
    }

    return location.room_name || (location.room_id ? `Помещение #${location.room_id}` : null);
  };

  const startLoadingRef = useRef(startLoading);
  const finishLoadingRef = useRef(finishLoading);
  const handleErrorRef = useRef(handleError);
  const isMountedRef = useRef(true);
  const isLoadingRef = useRef(false);
  const requestKeyRef = useRef<string>("");

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    startLoadingRef.current = startLoading;
    finishLoadingRef.current = finishLoading;
    handleErrorRef.current = handleError;
  }, [startLoading, finishLoading, handleError]);

  const loadItems = useCallback(async (query?: string, isInitialLoad = false, page = 1) => {
    if (!user) return;
    if (!isMountedRef.current) return;

    // Создаем уникальный ключ для запроса на основе параметров
    const requestKey = `${query || ""}-${showDeleted}-${page}-${filters.locationType}-${filters.hasPhoto}-${filters.roomId}-${filters.showDeleted}`;

    // Проверяем, не выполняется ли уже такой же запрос
    if (isLoadingRef.current && requestKeyRef.current === requestKey) {
      return;
    }

    isLoadingRef.current = true;
    requestKeyRef.current = requestKey;

    startLoadingRef.current(isInitialLoad);

    try {
      const response = await getItems({
        query: query?.trim(),
        showDeleted,
        page,
        limit: itemsPerPage,
        locationType: filters.locationType,
        roomId: filters.roomId,
        hasPhoto: filters.hasPhoto,
      });

      if (!isMountedRef.current) return;

      // Проверяем, не изменились ли параметры запроса во время выполнения
      if (requestKeyRef.current !== requestKey) {
        return;
      }

      // API возвращает { data: Item[], totalCount: number }
      // request возвращает это напрямую, поэтому response будет { data: Item[], totalCount: number }
      // Но ApiResponse<T> означает, что response.data будет T, то есть Item[]
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        if (isMountedRef.current) {
          setItems([]);
          setTotalCount(0);
          finishLoadingRef.current(isInitialLoad, 0);
        }
        return;
      }

      setTotalCount(response.totalCount || 0);
      const itemsWithLocation: Item[] = response.data;

      // Проверяем еще раз перед обновлением состояния
      if (requestKeyRef.current !== requestKey || !isMountedRef.current) {
        return;
      }

      setItems(itemsWithLocation);
      finishLoadingRef.current(isInitialLoad, itemsWithLocation.length);
    } catch (err) {
      // Проверяем, не изменились ли параметры запроса во время выполнения
      if (requestKeyRef.current !== requestKey || !isMountedRef.current) {
        return;
      }
      handleErrorRef.current(err, isInitialLoad);
      setItems([]);
    } finally {
      // Сбрасываем флаг только если это был последний запрос
      if (requestKeyRef.current === requestKey) {
        isLoadingRef.current = false;
        requestKeyRef.current = "";
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- user checked inside callback, stable deps
  }, [user?.id, showDeleted, filters.roomId, filters.locationType, filters.hasPhoto, filters.showDeleted]);

  useEffect(() => {
    if (user && !isUserLoading) {
      setCurrentPage(1);
      loadItems(searchQuery, true, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, showDeleted, refreshTrigger, filters.locationType, filters.hasPhoto, filters.roomId, filters.showDeleted]);

  const handleSearch = useCallback((query: string) => {
    if (user && !isUserLoading) {
      setCurrentPage(1);
      loadItems(query || undefined, false, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isUserLoading]);

  useDebouncedSearch({
    searchQuery,
    onSearch: handleSearch,
    skipInitial: true,
  });

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm("Вы уверены, что хотите удалить эту вещь?")) {
      return;
    }

    try {
      const response = await softDeleteApi.softDelete("items", itemId);
      if (response.error) {
        throw new Error(response.error);
      }
      toast.success("Вещь успешно удалена");
      loadItems(searchQuery, false, currentPage);
    } catch (err) {
      console.error("Ошибка при удалении вещи:", err);
      toast.error("Произошла ошибка при удалении вещи");
    }
  };

  const handleRestoreItem = async (itemId: number) => {
    try {
      const response = await softDeleteApi.restoreDeleted("items", itemId);
      if (response.error) {
        throw new Error(response.error);
      }
      toast.success("Вещь успешно восстановлена");
      loadItems(searchQuery, false, currentPage);
    } catch (err) {
      console.error("Ошибка при восстановлении вещи:", err);
      toast.error("Произошла ошибка при восстановлении вещи");
    }
  };

  const printLabel = usePrintEntityLabel("item");

  const hasActiveFilters = filters.locationType !== null || filters.hasPhoto !== null || filters.roomId !== null || filters.showDeleted;
  const activeFiltersCount = [filters.locationType !== null, filters.hasPhoto !== null, filters.roomId !== null, filters.showDeleted].filter(Boolean).length;

  useEffect(() => {
    onActiveFiltersCountChange?.(activeFiltersCount);
  }, [activeFiltersCount, onActiveFiltersCountChange]);

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <ErrorCard message={error || ""} />

      {isLoading || isUserLoading ? (
        <div className="overflow-x-hidden">
          <ListSkeleton variant="table" rows={6} columns={5} />
        </div>
      ) : isSearching && items.length === 0 ? (
        <div className="overflow-x-hidden">
          <ListSkeleton variant="table" rows={6} columns={5} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Package}
          title={searchQuery ? "По вашему запросу ничего не найдено" : "Вещи не найдены"}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-hidden md:overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] hidden sm:table-cell whitespace-nowrap overflow-hidden text-ellipsis">ID</TableHead>
                    <TableHead className="whitespace-nowrap overflow-hidden text-ellipsis">Название</TableHead>
                    <TableHead className="hidden md:table-cell whitespace-nowrap overflow-hidden text-ellipsis">Помещение</TableHead>
                    <TableHead className="w-[120px] hidden lg:table-cell whitespace-nowrap overflow-hidden text-ellipsis">Дата перемещения</TableHead>
                    <TableHead className="w-[150px] text-right whitespace-nowrap overflow-hidden text-ellipsis">Действия</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={item.id}
                    className={item.deleted_at ? "opacity-60" : ""}
                  >
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        {item.deleted_at && (
                          <Badge variant="destructive" className="text-xs">Удалено</Badge>
                        )}
                        <span className="text-muted-foreground">#{item.id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-0">
                        {item.photo_url ? (
                          <div className="relative h-10 w-10 flex-shrink-0 rounded overflow-hidden border border-border bg-muted">
                            <Image
                              src={item.photo_url}
                              alt={item.name || `Вещь #${item.id}`}
                              fill
                              className="object-cover"
                              sizes="40px"
                              unoptimized={item.photo_url.includes("storage.supabase.co")}
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 flex-shrink-0 rounded border border-border bg-muted flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/items/${item.id}`}
                            className="font-medium hover:underline break-words leading-tight block"
                          >
                            {item.name || `Вещь #${item.id}`}
                          </Link>
                          {item.item_type?.name && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.item_type.name}
                            </p>
                          )}
                          <div className="md:hidden mt-1 text-xs text-muted-foreground space-y-0.5">
                            {item.last_location ? (
                              getRoomLabel(item.last_location) ? (
                                <div className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  <span className="truncate">{getRoomLabel(item.last_location)}</span>
                                </div>
                              ) : (
                                <span>Помещение не указано</span>
                              )
                            ) : (
                              <span>Помещение не указано</span>
                            )}
                          </div>
                        </div>
                        </div>
                      </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {item.last_location ? (
                        getRoomLabel(item.last_location) ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>{getRoomLabel(item.last_location)}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Помещение не указано</span>
                        )
                      ) : (
                        <span className="text-sm text-muted-foreground">Помещение не указано</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {item.last_location ? (
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.last_location.moved_at).toLocaleDateString("ru-RU", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="hidden md:flex">
                        <ListActions
                          isDeleted={!!item.deleted_at}
                          onEdit={() => router.push(`/items/${item.id}`)}
                          onMove={() => setMovingItemId(item.id)}
                          onPrintLabel={() => printLabel(item.id, item.name)}
                          onDelete={() => handleDeleteItem(item.id)}
                          onRestore={() => handleRestoreItem(item.id)}
                        />
                      </div>
                      <div className="flex md:hidden items-center justify-end gap-1">
                        {item.deleted_at ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRestoreItem(item.id)}
                            className="h-8 w-8 text-green-600 hover:text-green-700"
                            aria-label="Восстановить"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setMovingItemId(item.id)}
                              className="h-8 w-8"
                              aria-label="Переместить"
                            >
                              <ArrowRightLeft className="h-4 w-4" />
                            </Button>
                            <Popover
                              open={mobileActionsItemId === item.id}
                              onOpenChange={(open) => {
                                setMobileActionsItemId(open ? item.id : null);
                              }}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  aria-label="Открыть меню действий"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent align="end" className="w-40 p-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start gap-2"
                                  onClick={() => {
                                    router.push(`/items/${item.id}`);
                                    setMobileActionsItemId(null);
                                  }}
                                >
                                  <Pencil className="h-4 w-4 shrink-0" />
                                  <span>Редактировать</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start gap-2"
                                  onClick={() => {
                                    printLabel(item.id, item.name);
                                    setMobileActionsItemId(null);
                                  }}
                                >
                                  <Printer className="h-4 w-4 shrink-0" />
                                  <span>Печать этикетки</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                                  onClick={() => {
                                    handleDeleteItem(item.id);
                                    setMobileActionsItemId(null);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 shrink-0" />
                                  <span>Удалить</span>
                                </Button>
                              </PopoverContent>
                            </Popover>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {movingItemId && (
        <MoveItemForm
          itemId={movingItemId}
          itemName={items.find((i) => i.id === movingItemId)?.name || null}
          open={!!movingItemId}
          onOpenChange={(open) => !open && setMovingItemId(null)}
          onSuccess={() => {
            setMovingItemId(null);
            loadItems(searchQuery, false, currentPage);
          }}
        />
      )}

      {totalCount > itemsPerPage && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => {
                  if (currentPage > 1) {
                    const newPage = currentPage - 1;
                    setCurrentPage(newPage);
                    loadItems(searchQuery, false, newPage);
                  }
                }}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {(() => {
              const totalPages = Math.ceil(totalCount / itemsPerPage);
              const pages: (number | "ellipsis")[] = [];
              
              if (totalPages <= 7) {
                // Показываем все страницы
                for (let i = 1; i <= totalPages; i++) {
                  pages.push(i);
                }
              } else {
                // Показываем первую страницу
                pages.push(1);
                
                if (currentPage <= 3) {
                  // Текущая страница в начале
                  for (let i = 2; i <= 4; i++) {
                    pages.push(i);
                  }
                  pages.push("ellipsis");
                  pages.push(totalPages);
                } else if (currentPage >= totalPages - 2) {
                  // Текущая страница в конце
                  pages.push("ellipsis");
                  for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                  }
                } else {
                  // Текущая страница в середине
                  pages.push("ellipsis");
                  for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                  }
                  pages.push("ellipsis");
                  pages.push(totalPages);
                }
              }

              return pages.map((page, index) => {
                if (page === "ellipsis") {
                  return (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => {
                        setCurrentPage(page);
                        loadItems(searchQuery, false, page);
                      }}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              });
            })()}
            <PaginationItem>
              <PaginationNext
                onClick={() => {
                  const totalPages = Math.ceil(totalCount / itemsPerPage);
                  if (currentPage < totalPages) {
                    const newPage = currentPage + 1;
                    setCurrentPage(newPage);
                    loadItems(searchQuery, false, newPage);
                  }
                }}
                className={currentPage >= Math.ceil(totalCount / itemsPerPage) ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <Sheet 
        open={isFiltersOpen} 
        onOpenChange={setIsFiltersOpen}
      >
        <SheetContent 
          side="right"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <SheetHeader>
            <SheetTitle>Фильтры</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <ItemsFiltersPanel
              filters={filters}
              onFiltersChange={(newFilters) => {
                setFilters(newFilters);
              }}
              onReset={() => {
                const resetFilters: ItemsFilters = {
                  showDeleted: false,
                  locationType: null,
                  hasPhoto: null,
                  roomId: null,
                };
                setFilters(resetFilters);
              }}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ItemsList;
