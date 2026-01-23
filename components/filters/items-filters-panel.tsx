"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FormGroup } from "@/components/ui/form-group";
import { YesNoAllFilter } from "./yes-no-all-filter";
import { ShowDeletedCheckbox } from "./show-deleted-checkbox";
import { FormField } from "@/components/ui/form-field";
import { Combobox } from "@/components/ui/combobox";
import { useRooms } from "@/hooks/use-rooms";

export interface ItemsFilters {
  showDeleted: boolean;
  locationType: "all" | "room" | "place" | "container" | null;
  hasPhoto: boolean | null;
  roomId: number | null;
}

interface ItemsFiltersPanelProps {
  filters: ItemsFilters;
  onFiltersChange: (filters: ItemsFilters) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

const LOCATION_TYPE_OPTIONS = [
  { value: "all", label: "Все" },
  { value: "room", label: "Помещение" },
  { value: "place", label: "Место" },
  { value: "container", label: "Контейнер" },
] as const;

export const ItemsFiltersPanel = ({
  filters,
  onFiltersChange,
  onReset,
  hasActiveFilters,
}: ItemsFiltersPanelProps) => {
  const { rooms, isLoading: isLoadingRooms } = useRooms();
  const [roomOptions, setRoomOptions] = useState<
    Array<{ value: string; label: string }>
  >([{ value: "all", label: "Все помещения" }]);

  useEffect(() => {
    if (!isLoadingRooms) {
      if (rooms && rooms.length > 0) {
        const options = [
          { value: "all", label: "Все помещения" },
          ...rooms.map((room) => ({
            value: room.id.toString(),
            label: room.name || `Помещение #${room.id}`,
          })),
        ];
        setRoomOptions(options);
      } else {
        setRoomOptions([{ value: "all", label: "Все помещения" }]);
      }
    }
  }, [rooms, isLoadingRooms]);

  const handleShowDeletedChange = (checked: boolean) => {
    onFiltersChange({ ...filters, showDeleted: checked });
  };

  const handleLocationTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      locationType: value === "all" ? null : (value as "room" | "place" | "container"),
    });
  };

  const handleHasPhotoChange = (value: boolean | null) => {
    onFiltersChange({ ...filters, hasPhoto: value });
  };

  const handleRoomChange = (value: string) => {
    onFiltersChange({
      ...filters,
      roomId: value === "all" ? null : parseInt(value, 10),
    });
  };

  return (
    <FormGroup>
      <ShowDeletedCheckbox
        label="Показывать удаленные вещи"
        checked={filters.showDeleted}
        onChange={handleShowDeletedChange}
      />

      <FormField label="Тип местоположения">
        <Combobox
          options={LOCATION_TYPE_OPTIONS}
          value={filters.locationType || "all"}
          onValueChange={handleLocationTypeChange}
          placeholder="Выберите..."
          searchPlaceholder="Поиск..."
          emptyText="Не найдено"
        />
      </FormField>

      <YesNoAllFilter
        label="Есть фото"
        value={filters.hasPhoto}
        onChange={handleHasPhotoChange}
      />

      <FormField label="Помещение">
        <Combobox
          options={roomOptions}
          value={filters.roomId ? filters.roomId.toString() : "all"}
          onValueChange={handleRoomChange}
          placeholder={isLoadingRooms ? "Загрузка..." : "Выберите помещение..."}
          searchPlaceholder="Поиск помещения..."
          emptyText="Помещения не найдены"
          disabled={isLoadingRooms}
        />
      </FormField>

      {hasActiveFilters && (
        <Button variant="outline" className="w-full" onClick={onReset}>
          Сбросить фильтры
        </Button>
      )}
    </FormGroup>
  );
};
