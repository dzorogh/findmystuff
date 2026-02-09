"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [open, setOpen] = React.useState(false);

  const selectedRoom = rooms.find(
    (room) => room.id.toString() === selectedRoomId
  );

  return (
    <Field>
      <FieldLabel htmlFor={`${id}-combobox`}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled || (isLoading ? false : rooms.length === 0)}
            id={`${id}-combobox`}
          >
            {selectedRoom
              ? selectedRoom.name || `Помещение #${selectedRoom.id}`
              : "-- Выберите помещение --"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Поиск помещения..." />
            <CommandList>
              {isLoading ? (
                <div className="p-2 space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <CommandEmpty>Помещения не найдены</CommandEmpty>
                  <CommandGroup>
                    {rooms.map((room) => {
                      const displayName = room.name || `Помещение #${room.id}`;
                      const isSelected = room.id.toString() === selectedRoomId;
                      const itemValue = `${room.id}-${displayName}`;
                      return (
                        <CommandItem
                          key={room.id}
                          value={itemValue}
                          keywords={[room.id.toString(), displayName, room.name || ""]}
                          onSelect={() => {
                            onRoomIdChange(room.id.toString());
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              isSelected ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {displayName}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {!isLoading && rooms.length === 0 && (
        <p className="text-xs text-destructive">
          Помещения не найдены. Сначала создайте помещение.
        </p>
      )}
    </Field>
  );
};

export default RoomCombobox;
