"use client";

import { Button } from "@/components/ui/button";
import { SheetFooter } from "@/components/ui/sheet";
import { Loader2, LucideIcon } from "lucide-react";

interface FormFooterProps {
  isSubmitting: boolean;
  onCancel: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  submitIcon?: LucideIcon;
  disabled?: boolean;
}

export const FormFooter = ({
  isSubmitting,
  onCancel,
  submitLabel = "Сохранить",
  cancelLabel = "Отмена",
  submitIcon: SubmitIcon,
  disabled = false,
}: FormFooterProps) => {
  return (
    <SheetFooter>
      <Button type="button" variant="outline" onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button type="submit" disabled={isSubmitting || disabled}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Сохранение...
          </>
        ) : SubmitIcon ? (
          <>
            <SubmitIcon className="mr-2 h-4 w-4" />
            {submitLabel}
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </SheetFooter>
  );
};
