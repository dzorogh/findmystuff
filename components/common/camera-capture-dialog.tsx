"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, Loader2 } from "lucide-react";

interface CameraCaptureDialogProps {
  open: boolean;
  onClose: () => void;
  onCapture: (blob: Blob) => void;
}

export function CameraCaptureDialog({
  open,
  onClose,
  onCapture,
}: CameraCaptureDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!open) {
      stopStream();
      return;
    }

    if (typeof window === "undefined") return;

    let cancelled = false;

    const initCamera = async () => {
      setError(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;

        if (video) {
          video.srcObject = stream;
          await video.play();
        }

        if (!cancelled) {
          setIsReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Camera init error:", err);
          const msg =
            err instanceof Error
              ? err.message
              : "Не удалось получить доступ к камере";
          setError(
            msg.includes("Permission") || msg.includes("NotAllowedError")
              ? "Нет разрешения на доступ к камере"
              : msg
          );
        }
      }
    };

    initCamera();

    return () => {
      cancelled = true;
      stopStream();
      setIsReady(false);
      setError(null);
    };
  }, [open, stopStream]);

  const handleClose = useCallback(() => {
    stopStream();
    onClose();
  }, [stopStream, onClose]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const stream = streamRef.current;

    if (!video || !stream || !isReady || isCapturing) return;

    setIsCapturing(true);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setError("Не удалось создать контекст canvas");
        setIsCapturing(false);
        return;
      }
      ctx.drawImage(video, 0, 0);

      canvas.toBlob(
        (blob) => {
          setIsCapturing(false);
          if (blob) {
            handleClose();
            onCapture(blob);
          } else {
            setError("Не удалось создать изображение");
          }
        },
        "image/jpeg",
        0.9
      );
    } catch (err) {
      setIsCapturing(false);
      setError(
        err instanceof Error ? err.message : "Ошибка при съёмке фотографии"
      );
    }
  }, [isReady, isCapturing, onCapture, handleClose]);

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) handleClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Сфотографировать вещь</DialogTitle>
        </DialogHeader>

        <div className="relative w-full overflow-hidden rounded-lg border aspect-square bg-muted">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />

          {!isReady && !error && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground bg-background/80">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Инициализация камеры...</span>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive text-center">
                {error}
              </div>
            </div>
          )}
        </div>

        {isReady && (
          <p className="text-center text-sm text-muted-foreground">
            Наведите камеру на предмет и нажмите кнопку
          </p>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Отмена
          </DialogClose>
          <Button
            onClick={handleCapture}
            disabled={!isReady || !!error || isCapturing}
          >
            {isCapturing ? (
              <Loader2 className="h-4 w-4 animate-spin" data-icon="inline-start" />
            ) : (
              <Camera data-icon="inline-start" />
            )}
            Сфотографировать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
