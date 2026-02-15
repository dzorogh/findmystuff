"use client";

import { useEffect, useRef, useState, useCallback, useId } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { parseEntityQrPayload, type EntityQrPayload } from "@/lib/entities/helpers/qr-code";

const FPS = 10;
const EAN_13_REGEX = /^\d{13}$/;

type ScannerMode = "qr" | "barcode";

interface ScannerBaseProps {
  open: boolean;
  onClose: () => void;
  title: string;
  scanningHint: string;
  mode: ScannerMode;
}

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  onScanSuccess: (result: EntityQrPayload) => void;
}

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScanSuccess: (barcode: string) => void;
}

function ScannerBase({
  open,
  onClose,
  title,
  scanningHint,
  mode,
  onScanSuccess,
}: ScannerBaseProps & {
  onScanSuccess: (value: string | EntityQrPayload) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const scannerRef = useRef<
    { clear: () => void | Promise<void>; stop: () => Promise<void> } | null
  >(null);
  const isScanningRef = useRef(false);
  const isInitializingRef = useRef(false);
  const initAttemptRef = useRef(0);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scanSuccessCallbackRef = useRef(onScanSuccess);
  const elementId = useId().replace(/:/g, "-");

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    scanSuccessCallbackRef.current = onScanSuccess;
  }, [onScanSuccess]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (isScanningRef.current) {
          await scannerRef.current.stop().catch(() => { });
        }
        await Promise.resolve(scannerRef.current.clear()).catch(() => { });
      } catch (err) {
        console.debug("Error stopping scanner:", err);
      }
      isScanningRef.current = false;
      setIsScanning(false);
      scannerRef.current = null;
    }
    isInitializingRef.current = false;

    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = "";
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
    }
  }, [elementId]);

  useEffect(() => {
    if (!open) {
      stopScanner();
      initAttemptRef.current = 0;
      setError(null);
      setIsScanning(false);
      return;
    }

    if (typeof window === "undefined") return;

    const currentAttempt = ++initAttemptRef.current;
    if (isInitializingRef.current || isScanningRef.current) return;

    const initScanner = async () => {
      if (currentAttempt !== initAttemptRef.current) return;

      if (scannerRef.current) {
        await stopScanner();
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      if (currentAttempt !== initAttemptRef.current) return;

      isInitializingRef.current = true;
      setError(null);

      try {
        await new Promise((resolve) => setTimeout(resolve, 100));

        const element = document.getElementById(elementId);
        if (!element) {
          throw new Error("Элемент для сканера не найден в DOM");
        }

        element.innerHTML = "";
        while (element.firstChild) {
          element.removeChild(element.firstChild);
        }

        if (currentAttempt !== initAttemptRef.current) {
          isInitializingRef.current = false;
          return;
        }

        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import(
          "html5-qrcode"
        );

        const Html5QrcodeCtor =
          typeof Html5Qrcode === "function"
            ? Html5Qrcode
            : (Html5Qrcode as { Html5Qrcode?: typeof Html5Qrcode }).Html5Qrcode;

        if (!Html5QrcodeCtor) {
          throw new Error("Не удалось найти Html5Qrcode в модуле.");
        }

        const formats =
          mode === "qr"
            ? [Html5QrcodeSupportedFormats.QR_CODE]
            : [Html5QrcodeSupportedFormats.EAN_13];

        const scanner = new Html5QrcodeCtor(elementId, {
          verbose: false,
          formatsToSupport: formats,
        });

        scannerRef.current = scanner;

        const devices = await Html5QrcodeCtor.getCameras();
        if (devices.length === 0) {
          setError("Камера не найдена.");
          isInitializingRef.current = false;
          return;
        }

        const backCamera = devices.find(
          (d) =>
            d.label?.toLowerCase().includes("back") ||
            d.label?.toLowerCase().includes("rear") ||
            d.label?.toLowerCase().includes("environment"),
        );
        const selectedCamera = backCamera || devices[0];
        if (!selectedCamera?.id) {
          throw new Error("Не удалось выбрать камеру");
        }

        await scanner.start(
          selectedCamera.id,
          {
            fps: FPS,
            aspectRatio: 1.0,
            disableFlip: false,
          },
          (decodedText: string) => {
            const trimmed = decodedText.trim();
            if (mode === "qr") {
              const parsed = parseEntityQrPayload(trimmed);
              if (parsed) {
                scanSuccessCallbackRef.current(parsed);
                stopScanner();
              } else {
                setError(
                  "Неверный формат QR-кода. Ожидается формат этикетки: тип:id (например, item:123).",
                );
              }
            } else {
              if (EAN_13_REGEX.test(trimmed)) {
                scanSuccessCallbackRef.current(trimmed);
                stopScanner();
              } else {
                setError(
                  "Распознан неверный формат. Ожидается штрихкод EAN-13 (13 цифр).",
                );
              }
            }
          },
          (errorMessage: string) => {
            if (
              errorMessage &&
              !errorMessage.includes("NotFoundException") &&
              !errorMessage.includes("No QR code found")
            ) {
              console.debug("Scanner error:", errorMessage);
            }
          },
        );

        if (currentAttempt !== initAttemptRef.current) {
          await stopScanner();
          return;
        }

        isScanningRef.current = true;
        setIsScanning(true);
        setError(null);
        isInitializingRef.current = false;
      } catch (err) {
        if (currentAttempt !== initAttemptRef.current) return;

        console.error("Scanner init error:", err);
        setError(
          err instanceof Error ? err.message : "Не удалось инициализировать сканер",
        );
        isScanningRef.current = false;
        setIsScanning(false);
        isInitializingRef.current = false;
      }
    };

    initScanner();

    return () => {
      initAttemptRef.current++;
      stopScanner();
    };
  }, [open, elementId, mode, stopScanner]);

  const handleClose = useCallback(() => {
    onClose();
    stopScanner().catch(() => { });
  }, [stopScanner, onClose]);

  if (!mounted) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) handleClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div
          id={elementId}
          className="relative z-0 w-full overflow-hidden rounded-lg border aspect-square bg-muted [&_video]:z-[1] [&_video]:pointer-events-auto [&_canvas]:z-[1] [&_canvas]:pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        />

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!isScanning && !error && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Инициализация камеры...</span>
          </div>
        )}

        {isScanning && (
          <div className="text-center text-sm text-muted-foreground">
            {scanningHint}
          </div>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Отмена
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function QRScanner({
  open,
  onClose,
  onScanSuccess,
}: QRScannerProps) {
  return (
    <ScannerBase
      open={open}
      onClose={onClose}
      title="Сканирование QR-кода"
      scanningHint="Наведите камеру на QR-код"
      mode="qr"
      onScanSuccess={onScanSuccess as (value: string | EntityQrPayload) => void}
    />
  );
}

export function BarcodeScanner({
  open,
  onClose,
  onScanSuccess,
}: BarcodeScannerProps) {
  return (
    <ScannerBase
      open={open}
      onClose={onClose}
      title="Сканирование штрихкода"
      scanningHint="Наведите камеру на штрихкод EAN-13"
      mode="barcode"
      onScanSuccess={onScanSuccess as (value: string | EntityQrPayload) => void}
    />
  );
}
