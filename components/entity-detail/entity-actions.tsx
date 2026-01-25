import { Button } from "@/components/ui/button";
import { Edit, ArrowRightLeft, Trash2, RotateCcw } from "lucide-react";

interface EntityActionsProps {
  isDeleted: boolean;
  isDeleting: boolean;
  isRestoring: boolean;
  onEdit: () => void;
  onMove?: () => void;
  onDelete: () => void;
  onRestore: () => void;
  showMove?: boolean;
}

export const EntityActions = ({
  isDeleted,
  isDeleting,
  isRestoring,
  onEdit,
  onMove,
  onDelete,
  onRestore,
  showMove = true,
}: EntityActionsProps) => {
  const isDisabled = isDeleting || isRestoring;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onEdit}
        disabled={isDisabled}
      >
        <Edit className="h-4 w-4 mr-2" />
        Редактировать
      </Button>
      {!isDeleted && showMove && onMove && (
        <Button
          variant="outline"
          size="sm"
          onClick={onMove}
          disabled={isDisabled}
        >
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          Переместить
        </Button>
      )}
      {isDeleted ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onRestore}
          disabled={isDisabled}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Восстановить
        </Button>
      ) : (
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={isDisabled}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Удалить
        </Button>
      )}
    </div>
  );
};
