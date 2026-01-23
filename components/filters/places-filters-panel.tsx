"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FormGroup } from "@/components/ui/form-group";
import { ShowDeletedCheckbox } from "./show-deleted-checkbox";
import { FormField } from "@/components/ui/form-field";
import { Combobox } from "@/components/ui/combobox";
import { useEntityTypes } from "@/hooks/use-entity-types";
import { useRooms } from "@/hooks/use-rooms";

export interface PlacesFilters {
  showDeleted: boolean;
  entityTypeId: number | null;
  roomId: number | null;
}

interface PlacesFiltersPanelProps {
  filters: PlacesFilters;
  onFiltersChange: (filters: PlacesFilters) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export const PlacesFiltersPanel = ({
  filters,
  onFiltersChange,
  onReset,
  hasActiveFilters,
}: PlacesFiltersPanelProps) => {
  const { types: entityTypes, isLoading: isLoadingTypes } = useEntityTypes("place");
  const { rooms, isLoading: isLoadingRooms } = useRooms();
  const [placeTypeOptions, setPlaceTypeOptions] = useState<
    Array<{ value: string; label: string }>
  >([{ value: "all", label: "Все типы" }]);
  const [roomOptions, setRoomOptions] = useState<
    Array<{ value: string; label: string }>
  >([{ value: "all", label: "Все помещения" }]);

  useEffect(() => {
    if (!isLoadingTypes) {
      if (entityTypes && entityTypes.length > 0) {
        const options = [
          { value: "all", label: "Все типы" },
          ...entityTypes.map((type) => ({
            value: type.id.toString(),
            label: `${type.code} - ${type.name}`,
          })),
        ];
        setPlaceTypeOptions(options);
      } else {
        // Если загрузка завершена, но типов нет, показываем только "Все типы"
        setPlaceTypeOptions([{ value: "all", label: "Все типы" }]);
      }
    }
  }, [entityTypes, isLoadingTypes]);

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
        // Если загрузка завершена, но помещений нет, показываем только "Все помещения"
        setRoomOptions([{ value: "all", label: "Все помещения" }]);
      }
    }
  }, [rooms, isLoadingRooms]);

  const handleShowDeletedChange = (checked: boolean) => {
    onFiltersChange({ ...filters, showDeleted: checked });
  };

  const handleEntityTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      entityTypeId: value === "all" ? null : parseInt(value, 10),
    });
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
        label="Показывать удаленные места"
        checked={filters.showDeleted}
        onChange={handleShowDeletedChange}
      />

      <FormField label="Тип места">
        <Combobox
          options={placeTypeOptions}
          value={filters.entityTypeId ? filters.entityTypeId.toString() : "all"}
          onValueChange={handleEntityTypeChange}
          placeholder={isLoadingTypes ? "Загрузка..." : "Выберите тип..."}
          searchPlaceholder="Поиск типа..."
          emptyText="Типы не найдены"
          disabled={isLoadingTypes}
        />
      </FormField>

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
