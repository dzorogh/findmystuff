"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Edit, ArrowRightLeft, Trash2, RotateCcw, Printer, MoreHorizontal } from "lucide-react";

interface EntityActionsProps {
  isDeleted: boolean;
  isDeleting: boolean;
  isRestoring: boolean;
  onEdit: () => void;
  onMove?: () => void;
  onPrintLabel?: () => void;
  onDelete: () => void;
  onRestore: () => void;
  showMove?: boolean;
  showEdit?: boolean;
}

const closeAfter = (fn: () => void, close: () => void) => () => {
  fn();
  close();
};

export const EntityActions = ({
  isDeleted,
  isDeleting,
  isRestoring,
  onEdit,
  onMove,
  onPrintLabel,
  onDelete,
  onRestore,
  showMove = true,
  showEdit = true,
}: EntityActionsProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isDisabled = isDeleting || isRestoring;

  const btnClass = "h-9 w-9 p-0 sm:h-auto sm:w-auto sm:px-4 sm:py-2 shrink-0";
  const iconClass = "h-4 w-4 sm:mr-2";
  const textClass = "hidden sm:inline";

  const desktopActions = (
    <>
      {showEdit && (
        <Button
          variant="outline"
          size="sm"
          className={btnClass}
          onClick={onEdit}
          disabled={isDisabled}
          aria-label="Редактировать"
        >
          <Edit className={iconClass} />
          <span className={textClass}>Редактировать</span>
        </Button>
      )}
      {!isDeleted && showMove && onMove && (
        <Button
          variant="outline"
          size="sm"
          className={btnClass}
          onClick={onMove}
          disabled={isDisabled}
          aria-label="Переместить"
        >
          <ArrowRightLeft className={iconClass} />
          <span className={textClass}>Переместить</span>
        </Button>
      )}
      {!isDeleted && onPrintLabel && (
        <Button
          variant="outline"
          size="sm"
          className={btnClass}
          onClick={onPrintLabel}
          disabled={isDisabled}
          aria-label="Печать этикетки"
        >
          <Printer className={iconClass} />
          <span className={textClass}>Печать этикетки</span>
        </Button>
      )}
      {isDeleted ? (
        <Button
          variant="outline"
          size="sm"
          className={btnClass}
          onClick={onRestore}
          disabled={isDisabled}
          aria-label="Восстановить"
        >
          <RotateCcw className={iconClass} />
          <span className={textClass}>Восстановить</span>
        </Button>
      ) : (
        <Button
          variant="destructive"
          size="sm"
          className={btnClass}
          onClick={onDelete}
          disabled={isDisabled}
          aria-label="Удалить"
        >
          <Trash2 className={iconClass} />
          <span className={textClass}>Удалить</span>
        </Button>
      )}
    </>
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex sm:hidden">
        <Popover open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              disabled={isDisabled}
              aria-label="Действия с сущностью"
              aria-haspopup="menu"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 p-1">
            {showEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={closeAfter(onEdit, () => setMobileMenuOpen(false))}
                disabled={isDisabled}
              >
                <Edit className="h-4 w-4" />
                Редактировать
              </Button>
            )}
            {!isDeleted && showMove && onMove && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={closeAfter(onMove, () => setMobileMenuOpen(false))}
                disabled={isDisabled}
              >
                <ArrowRightLeft className="h-4 w-4" />
                Переместить
              </Button>
            )}
            {!isDeleted && onPrintLabel && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={closeAfter(onPrintLabel, () => setMobileMenuOpen(false))}
                disabled={isDisabled}
              >
                <Printer className="h-4 w-4" />
                Печать этикетки
              </Button>
            )}
            {isDeleted ? (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={closeAfter(onRestore, () => setMobileMenuOpen(false))}
                disabled={isDisabled}
              >
                <RotateCcw className="h-4 w-4" />
                Восстановить
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={closeAfter(onDelete, () => setMobileMenuOpen(false))}
                disabled={isDisabled}
              >
                <Trash2 className="h-4 w-4" />
                Удалить
              </Button>
            )}
          </PopoverContent>
        </Popover>
      </div>
      <div className="hidden sm:flex flex-wrap items-center gap-2">
        {desktopActions}
      </div>
    </div>
  );
};
