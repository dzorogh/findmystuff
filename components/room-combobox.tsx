"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { useRooms } from "@/hooks/use-rooms";

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
  const { rooms } = useRooms();
  const [open, setOpen] = React.useState(false);

  const selectedRoom = rooms.find(
    (room) => room.id.toString() === selectedRoomId
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={`${id}-combobox`}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled || rooms.length === 0}
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
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {rooms.length === 0 && (
        <p className="text-xs text-destructive">
          Помещения не найдены. Сначала создайте помещение.
        </p>
      )}
    </div>
  );
};

export default RoomCombobox;
