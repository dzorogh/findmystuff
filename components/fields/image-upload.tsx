"use client";

import { useState, useRef, useEffect } from "react";
import { photoApi } from "@/lib/shared/api/photo";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  label?: string;
}

const ImageUpload = ({
  value,
  onChange,
  disabled = false,
  label = "Фотография",
}: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUploadingRef = useRef(false);

  // Синхронизируем preview с value при изменении value, но только если не идет загрузка
  useEffect(() => {
    if (!isUploadingRef.current) {
      setPreview(value || null);
    }
  }, [value]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверяем тип файла
    if (!file.type.startsWith("image/")) {
      alert("Файл должен быть изображением");
      return;
    }

    // Проверяем размер файла (максимум 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert("Размер файла не должен превышать 10MB");
      return;
    }

    // Показываем превью
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Загружаем на сервер
    setIsUploading(true);
    isUploadingRef.current = true;
    try {
      const response = await photoApi.uploadPhoto(file);

      if (!response.data?.url) {
        throw new Error("Сервер не вернул URL загруженного файла");
      }

      // Обновляем preview на реальный URL и вызываем onChange
      setPreview(response.data.url);
      onChange(response.data.url);
      // Даем время для обновления value prop перед снятием флага загрузки
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error("Ошибка загрузки фото:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Произошла ошибка при загрузке фото";
      alert(errorMessage);
      setPreview(value || null); // Возвращаем предыдущее значение
    } finally {
      setIsUploading(false);
      // Сбрасываем флаг загрузки после небольшой задержки, чтобы value успел обновиться
      setTimeout(() => {
        isUploadingRef.current = false;
      }, 200);
      // Сбрасываем input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Field>
      <div className="space-y-3">
        {preview ? (
          <div className="relative w-full aspect-square max-w-md rounded-lg overflow-hidden border border-border bg-muted">
            <Image
              src={preview}
              alt="Превью"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized={preview.includes("storage.supabase.co")}
            />
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemove}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center w-full aspect-square max-w-md rounded-2xl border-2 border-dashed border-border bg-muted/50">
            <div className="text-center space-y-2">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Нет фотографии
              </p>
            </div>
          </div>
        )}

        {!disabled && (
          <div className="">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Skeleton className="h-4 w-24" aria-hidden />
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {preview ? "Изменить фото" : "Загрузить фото"}
                </>
              )}
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading}
        />
      </div>
    </Field>
  );
};

export default ImageUpload;
