"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { photoApiClient } from "@/lib/shared/api/photo";
import { logError } from "@/lib/shared/logger";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, X, Image as ImageIcon, Sparkles } from "lucide-react";
import Image from "next/image";

export type EntityImageCardEntityType =
  | "item"
  | "place"
  | "room"
  | "container"
  | "building"
  | "furniture";

interface EntityImageCardProps {
  entityType: EntityImageCardEntityType;
  entityId: number;
  entityName: string;
  photoUrl: string | null;
  onPhotoChange: (url: string | null) => Promise<void>;
  disabled?: boolean;
}

export function EntityImageCard({
  entityType,
  entityId: _entityId,
  entityName,
  photoUrl,
  onPhotoChange,
  disabled = false,
}: EntityImageCardProps) {
  const [preview, setPreview] = useState<string | null>(photoUrl ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUploadingRef = useRef(false);

  useEffect(() => {
    if (!isUploadingRef.current) {
      setPreview(photoUrl ?? null);
    }
  }, [photoUrl]);

  const handlePhotoChange = async (url: string | null) => {
    setIsSaving(true);
    try {
      await onPhotoChange(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка при сохранении фото");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Файл должен быть изображением");
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Размер файла не должен превышать 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    setIsUploading(true);
    isUploadingRef.current = true;
    try {
      const response = await photoApiClient.uploadPhoto(file);

      if (!response.data?.url) {
        throw new Error("Сервер не вернул URL загруженного файла");
      }

      setPreview(response.data.url);
      await handlePhotoChange(response.data.url);
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      logError("Ошибка загрузки фото:", error);
      toast.error(
        error instanceof Error ? error.message : "Произошла ошибка при загрузке фото"
      );
      setPreview(photoUrl ?? null);
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        isUploadingRef.current = false;
      }, 200);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async () => {
    setPreview(null);
    await handlePhotoChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    const name = entityName?.trim();
    if (!name) return;

    setIsGenerating(true);
    try {
      const response = await photoApiClient.findEntityImage({ name, entityType });
      if (response.data?.url) {
        setPreview(response.data.url);
        await handlePhotoChange(response.data.url);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Ошибка генерации изображения"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const isBusy = disabled || isUploading || isGenerating || isSaving;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Фотография</CardTitle>
        <CardDescription>
          Загрузите фото или сгенерируйте по названию. JPG, PNG, GIF до 10MB.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
            </div>
          ) : (
            <div className="flex items-center justify-center w-full aspect-square max-w-md rounded-2xl border-2 border-dashed border-border bg-muted/50">
              <div className="text-center space-y-2">
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Нет фотографии</p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isBusy}
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isBusy}
        >
          {isUploading ? (
            <Skeleton className="h-4 w-24" aria-hidden />
          ) : (
            <>
              <Upload data-icon="inline-start" />
              {preview ? "Изменить фото" : "Загрузить фото"}
            </>
          )}
        </Button>
        {preview && (
          <Button
            type="button"
            variant="outline"
            onClick={handleRemove}
            disabled={isBusy}
          >
            <X data-icon="inline-start" />
            Удалить
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={handleGenerate}
          disabled={isBusy || !entityName?.trim()}
          className="ml-auto"
        >
          {isGenerating ? (
            <>
              <Sparkles data-icon="inline-start" className="animate-pulse" aria-hidden />
              Генерирую…
            </>
          ) : (
            <>
              <Sparkles data-icon="inline-start" aria-hidden />
              Сгенерировать
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
