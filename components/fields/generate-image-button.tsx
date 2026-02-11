"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { photoApi } from "@/lib/shared/api/photo";

interface GenerateImageButtonProps {
  entityName: string;
  entityType?: "item" | "place" | "room" | "container";
  onSuccess: (url: string) => void;
  disabled?: boolean;
}

export function GenerateImageButton({
  entityName,
  entityType,
  onSuccess,
  disabled = false,
}: GenerateImageButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    const name = entityName?.trim();
    if (!name) return;

    setIsLoading(true);
    try {
      const response = await photoApi.findEntityImage({ name, entityType });
      if (response.data?.url) {
        onSuccess(response.data.url);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Ошибка генерации изображения";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={disabled || isLoading || !entityName?.trim()}
    >
      {isLoading ? (
        <>
          <Sparkles className="mr-2 h-4 w-4 animate-pulse" aria-hidden />
          Генерирую…
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" aria-hidden />
          Сгенерировать изображение
        </>
      )}
    </Button>
  );
}
