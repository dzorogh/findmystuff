"use client";

import { Button } from "@/components/ui/button";
import { Pencil, ArrowRightLeft, Trash2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListActionsProps {
  isDeleted: boolean;
  onEdit?: () => void;
  onMove?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
  disabled?: boolean;
  className?: string;
}

export const ListActions = ({
  isDeleted,
  onEdit,
  onMove,
  onDelete,
  onRestore,
  disabled = false,
  className,
}: ListActionsProps) => {
  return (
    <div className={cn("flex items-center justify-end gap-1 sm:gap-2", className)}>
      {!isDeleted ? (
        <>
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              disabled={disabled}
              className="h-8 w-8"
              title="Редактировать"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onMove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMove}
              disabled={disabled}
              className="h-8 w-8"
              title="Переместить"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              disabled={disabled}
              className="h-8 w-8 text-destructive hover:text-destructive"
              title="Удалить"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </>
      ) : (
        onRestore && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRestore}
            disabled={disabled}
            className="h-8 w-8 text-green-600 hover:text-green-700"
            title="Восстановить"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )
      )}
    </div>
  );
};
