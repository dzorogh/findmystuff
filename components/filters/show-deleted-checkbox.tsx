"use client";

import { Field, FieldDescription } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface ShowDeletedCheckboxProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

export const ShowDeletedCheckbox = ({
  label = "Показывать удаленные",
  checked,
  onChange,
  description,
}: ShowDeletedCheckboxProps) => {
  return (
    <Field>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="showDeleted"
          checked={checked}
          onCheckedChange={(value) => onChange(value === true)}
          className="cursor-pointer"
          aria-label={label}
        />
        <Label htmlFor="showDeleted" className="text-sm font-normal cursor-pointer">
          {label}
        </Label>
      </div>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
};
