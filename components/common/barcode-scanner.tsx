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
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";
import { BarcodeFormat, BarcodeScanner } from "@capacitor-mlkit/barcode-scanning";

interface BarcodeScannerProps {
  onScanSuccess: (barcode: string) => void;
  onClose: () => void;
  open: boolean;
}

const EAN_13_REGEX = /^\d{13}$/;

const BarcodeScannerComponent = ({
  onScanSuccess,
  onClose,
  open,
}: BarcodeScannerProps) => {
  const [mounted, setMounted] = useState(false);
  const scannerRef = useRef<{ clear: () => void | Promise<void>; stop: () => Promise<void> } | null>(null);
  const isScanningRef = useRef(false);
  const isInitializingRef = useRef(false);
  const initAttemptRef = useRef(0);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scanSuccessCallbackRef = useRef(onScanSuccess);
  const barcodeReaderId = useId().replace(/:/g, "-");
  const nativeScanInProgressRef = useRef(false);
  const isNativePlatform = Capacitor.isNativePlatform();

  const handleNativeScan = useCallback(async () => {
    if (nativeScanInProgressRef.current) return;

    nativeScanInProgressRef.current = true;
    isInitializingRef.current = true;
    setError(null);
    setIsScanning(true);

    try {
      const { supported } = await BarcodeScanner.isSupported();
      if (!supported) {
        throw new Error("Сканирование штрихкодов на этом устройстве не поддерживается.");
      }

      const permissions = await BarcodeScanner.requestPermissions();
      if (permissions.camera !== "granted") {
        throw new Error("Доступ к камере запрещен. Разрешите доступ в настройках приложения.");
      }

      const { barcodes } = await BarcodeScanner.scan({
        formats: [BarcodeFormat.Ean13],
        autoZoom: true,
      });

      const rawValue = barcodes[0]?.rawValue || barcodes[0]?.displayValue;
      if (!rawValue) {
        setError("Сканирование отменено.");
        return;
      }

      if (!EAN_13_REGEX.test(rawValue)) {
        setError("Распознан неверный формат. Ожидается штрихкод EAN-13 (13 цифр).");
        return;
      }

      scanSuccessCallbackRef.current(rawValue);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage || "Не удалось инициализировать сканер");
    } finally {
      nativeScanInProgressRef.current = false;
      isInitializingRef.current = false;
      isScanningRef.current = false;
      setIsScanning(false);
    }
  }, [onClose]);

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
          await scannerRef.current.stop().catch(() => {});
        }
        await Promise.resolve(scannerRef.current.clear()).catch(() => {});
      } catch (err) {
        console.debug("Error stopping barcode scanner:", err);
      }
      isScanningRef.current = false;
      setIsScanning(false);
      scannerRef.current = null;
    }
    isInitializingRef.current = false;

    const element = document.getElementById(barcodeReaderId);
    if (element) {
      element.innerHTML = "";
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
    }
  }, [barcodeReaderId]);

  useEffect(() => {
    if (!open) {
      stopScanner();
      initAttemptRef.current = 0;
      setError(null);
      setIsScanning(false);
      return;
    }

    if (typeof window === "undefined") return;

    if (isNativePlatform) {
      handleNativeScan();
      return;
    }

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

        const element = document.getElementById(barcodeReaderId);
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

        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");

        type Html5QrcodeInstance = {
          start: (
            cameraId: string,
            config: {
              fps?: number;
              qrbox?: { width: number; height: number };
              aspectRatio?: number;
              disableFlip?: boolean;
            },
            callback: (decodedText: string) => void,
            errorCallback?: (errorMessage: string) => void
          ) => Promise<void>;
          stop: () => Promise<void>;
          clear: () => Promise<void>;
        };
        type Html5QrcodeConstructor = (new (
          elementId: string,
          config?: { verbose?: boolean; formatsToSupport?: number[] }
        ) => Html5QrcodeInstance) & {
          getCameras: () => Promise<Array<{ id: string; label: string }>>;
        };

        const Html5QrcodeCtor =
          typeof Html5Qrcode === "function"
            ? Html5Qrcode
            : (Html5Qrcode as { Html5Qrcode?: Html5QrcodeConstructor }).Html5Qrcode;

        if (!Html5QrcodeCtor) {
          throw new Error("Не удалось найти Html5Qrcode в модуле.");
        }

        const scanner = new Html5QrcodeCtor(barcodeReaderId, {
          verbose: false,
          formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13],
        });

        scannerRef.current = scanner;

        const containerElement = document.getElementById(barcodeReaderId);
        const containerWidth = containerElement?.clientWidth || Math.min(400, window.innerWidth - 80);
        const qrboxWidth = Math.min(320, containerWidth - 40);
        const qrboxHeight = Math.min(100, 100);

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
            d.label?.toLowerCase().includes("environment")
        );
        const selectedCamera = backCamera || devices[0];
        if (!selectedCamera?.id) {
          throw new Error("Не удалось выбрать камеру");
        }

        await scanner.start(
          selectedCamera.id,
          {
            fps: 10,
            qrbox: { width: qrboxWidth, height: qrboxHeight },
            aspectRatio: 1.0,
            disableFlip: false,
          },
          (decodedText: string) => {
            const trimmed = decodedText.trim();
            if (EAN_13_REGEX.test(trimmed)) {
              scanSuccessCallbackRef.current(trimmed);
              stopScanner();
            } else {
              setError("Распознан неверный формат. Ожидается штрихкод EAN-13 (13 цифр).");
            }
          },
          (errorMessage: string) => {
            if (errorMessage && !errorMessage.includes("NotFoundException") && !errorMessage.includes("No QR code found")) {
              console.debug("Barcode scanner error:", errorMessage);
            }
          }
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

        console.error("Barcode scanner init error:", err);
        setError(err instanceof Error ? err.message : "Не удалось инициализировать сканер");
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
  }, [open, barcodeReaderId, isNativePlatform, stopScanner, handleNativeScan]);

  const handleClose = useCallback(() => {
    onClose();
    stopScanner().catch(() => {});
  }, [stopScanner, onClose]);

  useEffect(() => {
    if (!open || isNativePlatform) return;

    const style = document.createElement("style");
    style.id = `barcode-scanner-styles-${barcodeReaderId}`;
    style.textContent = `
      #${barcodeReaderId} video { z-index: 1 !important; pointer-events: auto !important; }
      #${barcodeReaderId} canvas { z-index: 1 !important; pointer-events: auto !important; }
      #${barcodeReaderId} { pointer-events: auto !important; position: relative !important; }
    `;
    document.head.appendChild(style);
    return () => {
      document.getElementById(`barcode-scanner-styles-${barcodeReaderId}`)?.remove();
    };
  }, [open, barcodeReaderId, isNativePlatform]);

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
          <DialogTitle>Сканирование штрихкода</DialogTitle>
        </DialogHeader>

        {!isNativePlatform && (
          <div
            ref={containerRef}
            id={barcodeReaderId}
            className={cn(
              "relative z-0 w-full overflow-hidden rounded-lg border aspect-video bg-muted"
            )}
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!isScanning && !error && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{isNativePlatform ? "Готово к сканированию" : "Инициализация камеры..."}</span>
          </div>
        )}

        {isScanning && (
          <div className="text-center text-sm text-muted-foreground">
            {isNativePlatform ? "Открыта камера для сканирования..." : "Наведите камеру на штрихкод EAN-13"}
          </div>
        )}

        <DialogFooter className={cn(isNativePlatform && "sm:justify-between")}>
          {isNativePlatform && (
            <Button
              variant="default"
              onClick={(e) => {
                e.stopPropagation();
                handleNativeScan();
              }}
              disabled={isScanning}
            >
              {error ? "Сканировать снова" : "Открыть камеру"}
            </Button>
          )}
          <DialogClose render={<Button variant="outline" />}>
            Отмена
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScannerComponent;
