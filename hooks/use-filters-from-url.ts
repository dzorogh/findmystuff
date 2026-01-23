"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

export interface ItemsFiltersFromUrl {
  showDeleted?: boolean;
  locationType?: string | null;
  hasPhoto?: boolean | null;
  roomId?: number | null;
}

export interface ContainersFiltersFromUrl {
  showDeleted?: boolean;
  entityTypeId?: number | null;
  hasItems?: boolean | null;
  locationType?: string | null;
}

export interface PlacesFiltersFromUrl {
  showDeleted?: boolean;
  entityTypeId?: number | null;
  roomId?: number | null;
}

export interface RoomsFiltersFromUrl {
  showDeleted?: boolean;
  hasItems?: boolean | null;
  hasContainers?: boolean | null;
  hasPlaces?: boolean | null;
}

type FiltersType = ItemsFiltersFromUrl | ContainersFiltersFromUrl | PlacesFiltersFromUrl | RoomsFiltersFromUrl;

export const useFiltersFromUrl = <T extends FiltersType>(
  defaultFilters: T,
  filterKey: "items" | "containers" | "places" | "rooms"
) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInitialMount = useRef(true);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Читаем фильтры из URL при загрузке
  const getFiltersFromUrl = useCallback((): T => {
    const filters = { ...defaultFilters };

    // Парсим параметры из URL
    const showDeleted = searchParams.get("showDeleted");
    if (showDeleted !== null) {
      filters.showDeleted = showDeleted === "true";
    }

    if (filterKey === "items") {
      const locationType = searchParams.get("locationType");
      if (locationType !== null) {
        (filters as ItemsFiltersFromUrl).locationType = locationType === "all" ? null : locationType;
      }

      const hasPhoto = searchParams.get("hasPhoto");
      if (hasPhoto !== null) {
        (filters as ItemsFiltersFromUrl).hasPhoto = hasPhoto === "all" ? null : hasPhoto === "yes";
      }

      const roomId = searchParams.get("roomId");
      if (roomId !== null) {
        (filters as ItemsFiltersFromUrl).roomId = roomId === "all" ? null : parseInt(roomId, 10);
      }
    } else if (filterKey === "containers") {
      const entityTypeId = searchParams.get("entityTypeId");
      if (entityTypeId !== null) {
        (filters as ContainersFiltersFromUrl).entityTypeId = entityTypeId === "all" ? null : parseInt(entityTypeId, 10);
      }

      const hasItems = searchParams.get("hasItems");
      if (hasItems !== null) {
        (filters as ContainersFiltersFromUrl).hasItems = hasItems === "all" ? null : hasItems === "yes";
      }

      const locationType = searchParams.get("locationType");
      if (locationType !== null) {
        (filters as ContainersFiltersFromUrl).locationType = locationType === "all" ? null : locationType;
      }
    } else if (filterKey === "places") {
      const entityTypeId = searchParams.get("entityTypeId");
      if (entityTypeId !== null) {
        (filters as PlacesFiltersFromUrl).entityTypeId = entityTypeId === "all" ? null : parseInt(entityTypeId, 10);
      }

      const roomId = searchParams.get("roomId");
      if (roomId !== null) {
        (filters as PlacesFiltersFromUrl).roomId = roomId === "all" ? null : parseInt(roomId, 10);
      }
    } else if (filterKey === "rooms") {
      const hasItems = searchParams.get("hasItems");
      if (hasItems !== null) {
        (filters as RoomsFiltersFromUrl).hasItems = hasItems === "all" ? null : hasItems === "yes";
      }

      const hasContainers = searchParams.get("hasContainers");
      if (hasContainers !== null) {
        (filters as RoomsFiltersFromUrl).hasContainers = hasContainers === "all" ? null : hasContainers === "yes";
      }

      const hasPlaces = searchParams.get("hasPlaces");
      if (hasPlaces !== null) {
        (filters as RoomsFiltersFromUrl).hasPlaces = hasPlaces === "all" ? null : hasPlaces === "yes";
      }
    }

    return filters;
  }, [searchParams, defaultFilters, filterKey]);

  // Обновляем URL при изменении фильтров
  const updateFiltersInUrl = useCallback(
    (newFilters: T) => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      // Дебаунсим обновление URL, чтобы не создавать слишком много истории
      updateTimeoutRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());

        // Обновляем параметры
        if (newFilters.showDeleted !== undefined) {
          if (newFilters.showDeleted) {
            params.set("showDeleted", "true");
          } else {
            params.delete("showDeleted");
          }
        }

        if (filterKey === "items") {
          const itemsFilters = newFilters as ItemsFiltersFromUrl;
          if (itemsFilters.locationType !== undefined) {
            if (itemsFilters.locationType !== null) {
              params.set("locationType", itemsFilters.locationType);
            } else {
              params.delete("locationType");
            }
          }
          if (itemsFilters.hasPhoto !== undefined) {
            if (itemsFilters.hasPhoto === true) {
              params.set("hasPhoto", "yes");
            } else if (itemsFilters.hasPhoto === false) {
              params.set("hasPhoto", "no");
            } else {
              params.delete("hasPhoto");
            }
          }
          if (itemsFilters.roomId !== undefined) {
            if (itemsFilters.roomId !== null) {
              params.set("roomId", itemsFilters.roomId.toString());
            } else {
              params.delete("roomId");
            }
          }
        } else if (filterKey === "containers") {
          const containersFilters = newFilters as ContainersFiltersFromUrl;
          if (containersFilters.entityTypeId !== undefined) {
            if (containersFilters.entityTypeId !== null) {
              params.set("entityTypeId", containersFilters.entityTypeId.toString());
            } else {
              params.delete("entityTypeId");
            }
          }
          if (containersFilters.hasItems !== undefined) {
            if (containersFilters.hasItems === true) {
              params.set("hasItems", "yes");
            } else if (containersFilters.hasItems === false) {
              params.set("hasItems", "no");
            } else {
              params.delete("hasItems");
            }
          }
          if (containersFilters.locationType !== undefined) {
            if (containersFilters.locationType !== null) {
              params.set("locationType", containersFilters.locationType);
            } else {
              params.delete("locationType");
            }
          }
        } else if (filterKey === "places") {
          const placesFilters = newFilters as PlacesFiltersFromUrl;
          if (placesFilters.entityTypeId !== undefined) {
            if (placesFilters.entityTypeId !== null) {
              params.set("entityTypeId", placesFilters.entityTypeId.toString());
            } else {
              params.delete("entityTypeId");
            }
          }
          if (placesFilters.roomId !== undefined) {
            if (placesFilters.roomId !== null) {
              params.set("roomId", placesFilters.roomId.toString());
            } else {
              params.delete("roomId");
            }
          }
        } else if (filterKey === "rooms") {
          const roomsFilters = newFilters as RoomsFiltersFromUrl;
          if (roomsFilters.hasItems !== undefined) {
            if (roomsFilters.hasItems === true) {
              params.set("hasItems", "yes");
            } else if (roomsFilters.hasItems === false) {
              params.set("hasItems", "no");
            } else {
              params.delete("hasItems");
            }
          }
          if (roomsFilters.hasContainers !== undefined) {
            if (roomsFilters.hasContainers === true) {
              params.set("hasContainers", "yes");
            } else if (roomsFilters.hasContainers === false) {
              params.set("hasContainers", "no");
            } else {
              params.delete("hasContainers");
            }
          }
          if (roomsFilters.hasPlaces !== undefined) {
            if (roomsFilters.hasPlaces === true) {
              params.set("hasPlaces", "yes");
            } else if (roomsFilters.hasPlaces === false) {
              params.set("hasPlaces", "no");
            } else {
              params.delete("hasPlaces");
            }
          }
        }

        // Обновляем URL без перезагрузки страницы
        const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
        router.replace(newUrl, { scroll: false });
      }, 300);
    },
    [router, pathname, searchParams, filterKey]
  );

  useEffect(() => {
    isInitialMount.current = false;
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return {
    filtersFromUrl: getFiltersFromUrl(),
    updateFiltersInUrl,
    isInitialMount: isInitialMount.current,
  };
};
