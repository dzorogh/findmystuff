"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FieldSet } from "../ui/field";

export interface EntityFiltersShellProps {
  /** Подпись чекбокса «Показывать удалённые» (зависит от сущности). */
  showDeletedLabel: string;
  showDeleted: boolean;
  onShowDeletedChange: (checked: boolean) => void;
  children: React.ReactNode;
}

export function EntityFiltersShell({
  showDeletedLabel,
  showDeleted,
  onShowDeletedChange,
  children,
}: EntityFiltersShellProps) {
  const handleShowDeletedChange = (checked: boolean) => {
    onShowDeletedChange(checked);
  };

  return (
    <FieldSet>
      <div className="flex items-center space-x-2">
        <Switch id="show-deleted" checked={showDeleted} onCheckedChange={handleShowDeletedChange} />
        <Label htmlFor="show-deleted">{showDeletedLabel}</Label>
      </div>
      {children}
    </FieldSet>
  );
}
