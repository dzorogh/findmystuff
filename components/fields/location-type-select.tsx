"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";

interface LocationTypeSelectProps {
  value: "all" | "room" | "place" | "container" | null;
  onValueChange: (value: string) => void;
}

export function LocationTypeSelect({ value, onValueChange }: LocationTypeSelectProps) {
  return (
    <Field>
      <FieldLabel htmlFor="location-type">Тип места</FieldLabel>
      <Select value={value || "all"} onValueChange={onValueChange}>
        <SelectTrigger id="location-type">
          <SelectValue placeholder="Выберите тип места..." />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {[
              { value: "all", label: "Все типы" },
              { value: "room", label: "Помещение" },
              { value: "place", label: "Место" },
              { value: "container", label: "Контейнер" },
            ].map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}
