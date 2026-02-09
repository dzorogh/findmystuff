"use client";

import { Combobox, ComboboxContent, ComboboxList, ComboboxInput, ComboboxItem } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FieldLabel } from "@/components/ui/field";
import { useRoomFilterOptions } from "@/lib/rooms/hooks/use-room-filter-options";

interface RoomsSelectProps {
  value: number | null;
  onValueChange?: (value: string | null) => void;
}

type RoomOption = {
  value: string;
  label: string;
}

export function RoomsSelect({ value, onValueChange }: RoomsSelectProps) {
  const { options: roomOptions, isLoading: isLoadingRooms } =
    useRoomFilterOptions();

  const handleValueChange = (value: RoomOption | null) => {
    onValueChange?.(value === null ? null : value.value);
  };

  const selectedRoom = roomOptions.find(option => option.value === value?.toString());

  return (
    <Field>
      <FieldLabel htmlFor="room">Помещения</FieldLabel>

      <Combobox
        value={selectedRoom ?? null}
        items={roomOptions}
        onValueChange={handleValueChange}
      >
        {isLoadingRooms ? (
          <Skeleton className="h-9 w-full" />
        ) : (
          <ComboboxInput id="room" placeholder="Выберите помещение..." />
        )}
        <ComboboxContent>
          <ComboboxList>
            {(option: typeof roomOptions[number]) => (
              <ComboboxItem key={option.value} value={option}>
                {option.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}

export { RoomsSelect as RoomFilter };
