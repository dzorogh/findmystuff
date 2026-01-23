"use client";

import { FormField } from "@/components/ui/form-field";
import { Combobox } from "@/components/ui/combobox";

interface YesNoAllFilterProps {
  label: string;
  value: boolean | null;
  onChange: (value: boolean | null) => void;
}

const YES_NO_ALL_OPTIONS = [
  { value: "all", label: "Все" },
  { value: "yes", label: "Да" },
  { value: "no", label: "Нет" },
] as const;

export const YesNoAllFilter = ({ label, value, onChange }: YesNoAllFilterProps) => {
  const stringValue = value === null ? "all" : value ? "yes" : "no";

  const handleValueChange = (newValue: string) => {
    onChange(newValue === "all" ? null : newValue === "yes");
  };

  return (
    <FormField label={label}>
      <Combobox
        options={YES_NO_ALL_OPTIONS}
        value={stringValue}
        onValueChange={handleValueChange}
        placeholder="Выберите..."
        searchPlaceholder="Поиск..."
        emptyText="Не найдено"
      />
    </FormField>
  );
};
