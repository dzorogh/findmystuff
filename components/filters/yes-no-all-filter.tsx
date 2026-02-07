"use client";

import { FormField } from "@/components/ui/form-field";
import { Combobox } from "@/components/ui/combobox";
import { FILTER_COMBOBOX_DEFAULT } from "./constants";
import { FieldSet, FieldLegend, FieldDescription, Field, FieldLabel } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
    <FieldSet className="w-full max-w-xs">
      <FieldLegend variant="label">{label}</FieldLegend>
      <RadioGroup value={stringValue} onValueChange={handleValueChange}>
        {YES_NO_ALL_OPTIONS.map((option) => (
          <Field orientation="horizontal" key={option.value}>
            <RadioGroupItem value={option.value} id={`yes-no-all-${option.value}`} />
            <FieldLabel htmlFor={`yes-no-all-${option.value}`} className="font-normal">
              {option.label}
            </FieldLabel>
          </Field>
        ))}
      </RadioGroup>
    </FieldSet>
  );
};
