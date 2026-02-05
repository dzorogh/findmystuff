"use client";

import { Button } from "@/components/ui/button";
import { FormGroup } from "@/components/ui/form-group";
import { ShowDeletedCheckbox } from "./show-deleted-checkbox";
import { FILTER_RESET_LABEL } from "./constants";

export interface EntityFiltersShellProps {
  /** Подпись чекбокса «Показывать удалённые» (зависит от сущности). */
  showDeletedLabel: string;
  showDeleted: boolean;
  onShowDeletedChange: (checked: boolean) => void;
  /** В режиме controlled вызывается при переключении, не обновляя только внутреннее состояние родителя. */
  onShowDeletedExternalChange?: (show: boolean) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  children: React.ReactNode;
}

export function EntityFiltersShell({
  showDeletedLabel,
  showDeleted,
  onShowDeletedChange,
  onShowDeletedExternalChange,
  onReset,
  hasActiveFilters,
  children,
}: EntityFiltersShellProps) {
  const handleShowDeletedChange = (checked: boolean) => {
    onShowDeletedExternalChange?.(checked);
    onShowDeletedChange(checked);
  };

  return (
    <FormGroup>
      <ShowDeletedCheckbox
        label={showDeletedLabel}
        checked={showDeleted}
        onChange={handleShowDeletedChange}
      />
      {children}
      {hasActiveFilters && (
        <Button variant="outline" className="w-full" onClick={onReset}>
          {FILTER_RESET_LABEL}
        </Button>
      )}
    </FormGroup>
  );
}
