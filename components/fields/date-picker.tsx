"use client";

import * as React from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Field, FieldLabel } from "@/components/ui/field";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  label?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  id = "date-picker",
  label = "Дата",
  disabled = false,
  placeholder = "Выберите дату",
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const date = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value + "T12:00:00") : undefined;

  const handleSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      onChange("");
      return;
    }
    onChange(format(selectedDate, "yyyy-MM-dd"));
    setOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setOpen(false);
  };

  return (
    <Field className={cn(className)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          nativeButton={true}
          render={
            <Button
              variant="outline"
              id={id}
              disabled={disabled}
              data-empty={!date}
              className={cn(
                "w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground",
                !date && "font-normal"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "d MMMM yyyy", { locale: ru }) : <span>{placeholder}</span>}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align="start">
          {date && (
            <div className="p-2 border-b">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={handleClear}
              >
                Очистить
              </Button>
            </div>
          )}
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            disabled={disabled}
            locale={ru}
          />
        </PopoverContent>
      </Popover>
    </Field>
  );
}
