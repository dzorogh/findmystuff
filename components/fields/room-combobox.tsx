"use client";

import * as React from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { useRooms } from "@/lib/rooms/hooks/use-rooms";

interface RoomComboboxProps {
  selectedRoomId: string;
  onRoomIdChange: (id: string) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
  required?: boolean;
}

const RoomCombobox = ({
  selectedRoomId,
  onRoomIdChange,
  disabled = false,
  label = "Выберите помещение",
  id = "room-combobox",
  required = false,
}: RoomComboboxProps) => {
  const { rooms, isLoading } = useRooms();

  const items = React.useMemo(
    () =>
      rooms.map((room) => ({
        value: room.id.toString(),
        label: room.name || `Помещение #${room.id}`,
      })),
    [rooms]
  );

  const selectedItem = items.find((i) => i.value === selectedRoomId) ?? null;

  const handleValueChange = (item: { value: string; label: string } | null) => {
    onRoomIdChange(item?.value ?? "");
  };

  return (
    <Field>
      <FieldLabel htmlFor={`${id}-combobox`}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </FieldLabel>
      <Combobox
        value={selectedItem}
        items={items}
        onValueChange={handleValueChange}
        disabled={disabled || (isLoading ? false : items.length === 0)}
      >
        {isLoading ? (
          <Skeleton className="h-8 w-full" />
        ) : (
          <ComboboxInput
            id={`${id}-combobox`}
            placeholder="Поиск помещения..."
          />
        )}
        <ComboboxContent>
          <ComboboxEmpty>Помещения не найдены</ComboboxEmpty>
          <ComboboxList>
            {(item: { value: string; label: string }) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {!isLoading && items.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Помещения не найдены. Сначала создайте помещение.
        </p>
      )}
    </Field>
  );
};

export default RoomCombobox;
