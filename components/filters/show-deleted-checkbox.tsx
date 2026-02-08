"use client";

import { Field, FieldDescription } from "@/components/ui/field";
import { Label } from "@/components/ui/label";

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
        <input
          type="checkbox"
          id="showDeleted"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
        />
        <Label htmlFor="showDeleted" className="text-sm font-normal cursor-pointer">
          {label}
        </Label>
      </div>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
};
