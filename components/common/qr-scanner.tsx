"use client";

import { useEffect, useRef, useState, useCallback, useId } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseEntityQrPayload, type EntityQrPayload } from "@/lib/entities/helpers/qr-code";
import { Capacitor } from "@capacitor/core";
import { BarcodeFormat, BarcodeScanner } from "@capacitor-mlkit/barcode-scanning";

interface QRScannerProps {
  onScanSuccess: (result: EntityQrPayload) => void;
  onClose: () => void;
  open: boolean;
}

const QRScanner = ({ onScanSuccess, onClose, open }: QRScannerProps) => {
  const [mounted, setMounted] = useState(false);
  const scannerRef = useRef<{ clear: () => Promise<void>; stop: () => Promise<void> } | null>(null);
  const isScanningRef = useRef(false);
  const isInitializingRef = useRef(false);
  const initAttemptRef = useRef(0);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scanSuccessCallbackRef = useRef(onScanSuccess);
  const qrReaderId = useId().replace(/:/g, "-"); // Уникальный ID для элемента сканера
  const nativeScanInProgressRef = useRef(false);
  const isNativePlatform = Capacitor.isNativePlatform();

  const parseQrPayload = useCallback((decodedText: string): EntityQrPayload | null => {
    return parseEntityQrPayload(decodedText);
  }, []);

  const handleNativeScan = useCallback(async () => {
    if (nativeScanInProgressRef.current) {
      return;
    }

    nativeScanInProgressRef.current = true;
    isInitializingRef.current = true;
    setError(null);
    setIsScanning(true);

    try {
      const { supported } = await BarcodeScanner.isSupported();

      if (!supported) {
        throw new Error("Сканирование на этом устройстве не поддерживается.");
      }

      const permissions = await BarcodeScanner.requestPermissions();

      if (permissions.camera !== "granted") {
        throw new Error("Доступ к камере запрещен. Разрешите доступ в настройках приложения.");
      }

      const { barcodes } = await BarcodeScanner.scan({
        formats: [BarcodeFormat.QrCode],
        autoZoom: true,
      });

      const rawValue = barcodes[0]?.rawValue || barcodes[0]?.displayValue;

      if (!rawValue) {
        setError("Сканирование отменено.");
        return;
      }

      const parsed = parseQrPayload(rawValue);

      if (!parsed) {
        setError("Неверный формат QR-кода. Ожидается формат этикетки: тип:id (например, item:123).");
        return;
      }

      scanSuccessCallbackRef.current(parsed);
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
  }, [onClose, parseQrPayload]);

  // Проверка монтирования на клиенте
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Обновляем ref при изменении callback
  useEffect(() => {
    scanSuccessCallbackRef.current = onScanSuccess;
  }, [onScanSuccess]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (isScanningRef.current) {
          await scannerRef.current.stop().catch(() => { });
        }
        await scannerRef.current.clear().catch(() => { });
      } catch (err) {
        // Игнорируем ошибки при остановке
        console.debug("Error stopping scanner:", err);
      }
      isScanningRef.current = false;
      setIsScanning(false);
      scannerRef.current = null;
    }
    isInitializingRef.current = false;

    // Очищаем все элементы, созданные html5-qrcode
    const element = document.getElementById(qrReaderId);
    if (element) {
      element.innerHTML = "";
      // Удаляем все дочерние элементы, включая видео и canvas
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
    }
  }, [qrReaderId]);

  useEffect(() => {
    if (!open) {
      stopScanner();
      initAttemptRef.current = 0;
      setError(null);
      setIsScanning(false);
      return;
    }

    // Проверяем, что мы на клиенте
    if (typeof window === "undefined") {
      return;
    }

    if (isNativePlatform) {
      handleNativeScan();
      return;
    }

    // Защита от множественных инициализаций - используем счетчик попыток
    const currentAttempt = ++initAttemptRef.current;

    if (isInitializingRef.current || isScanningRef.current) {
      console.debug("Scanner already initializing or scanning, skipping");
      return;
    }

    const initScanner = async () => {
      // Проверяем, что это все еще актуальная попытка инициализации
      if (currentAttempt !== initAttemptRef.current) {
        console.debug("Init attempt outdated, skipping");
        return;
      }

      // Убеждаемся, что предыдущий сканер остановлен
      if (scannerRef.current) {
        await stopScanner();
        // Даем время на очистку
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      // Еще раз проверяем актуальность попытки после задержки
      if (currentAttempt !== initAttemptRef.current) {
        console.debug("Init attempt outdated after cleanup, skipping");
        return;
      }

      isInitializingRef.current = true;
      setError(null);

      try {
        if (Capacitor.isNativePlatform()) {
          const { supported } = await BarcodeScanner.isSupported();

          if (!supported) {
            throw new Error("Сканирование на этом устройстве не поддерживается.");
          }

          const permissions = await BarcodeScanner.requestPermissions();

          if (permissions.camera !== "granted") {
            throw new Error("Доступ к камере запрещен. Разрешите доступ в настройках приложения.");
          }

          const { barcodes } = await BarcodeScanner.scan({
            formats: [BarcodeFormat.QrCode],
            autoZoom: true,
          });

          const rawValue = barcodes[0]?.rawValue || barcodes[0]?.displayValue;

          if (!rawValue) {
            setError("QR-код не найден. Повторите попытку.");
            isScanningRef.current = false;
            setIsScanning(false);
            isInitializingRef.current = false;
            return;
          }

          const parsed = parseQrPayload(rawValue);

          if (!parsed) {
            setError("Неверный формат QR-кода. Ожидается формат этикетки: тип:id (например, item:123).");
            isScanningRef.current = false;
            setIsScanning(false);
            isInitializingRef.current = false;
            return;
          }

          scanSuccessCallbackRef.current(parsed);
          onClose();
          isScanningRef.current = false;
          setIsScanning(false);
          isInitializingRef.current = false;
          return;
        }

        // Ждем, пока элемент будет в DOM
        await new Promise((resolve) => setTimeout(resolve, 100));

        const element = document.getElementById(qrReaderId);
        if (!element) {
          throw new Error("Элемент для сканера не найден в DOM");
        }

        // Полная очистка элемента перед инициализацией
        element.innerHTML = "";
        // Удаляем все дочерние элементы
        while (element.firstChild) {
          element.removeChild(element.firstChild);
        }

        // Проверяем актуальность попытки после очистки
        if (currentAttempt !== initAttemptRef.current) {
          console.debug("Init attempt outdated after DOM cleanup, skipping");
          isInitializingRef.current = false;
          return;
        }

        // Динамический импорт для избежания проблем с SSR
        const html5QrcodeModule = await import("html5-qrcode");

        // Различные варианты экспорта модуля
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
        type Html5QrcodeConstructor = (new (elementId: string, config?: { verbose?: boolean }) => Html5QrcodeInstance) & {
          getCameras: () => Promise<Array<{ id: string; label: string }>>;
        };
        type Html5QrcodeModule = {
          Html5Qrcode?: Html5QrcodeConstructor;
          default?: Html5QrcodeConstructor | { Html5Qrcode?: Html5QrcodeConstructor };
        };
        let Html5Qrcode: Html5QrcodeConstructor | undefined;
        const html5Mod = html5QrcodeModule as unknown as Html5QrcodeModule;
        if (html5Mod.Html5Qrcode) {
          Html5Qrcode = html5Mod.Html5Qrcode;
        } else if (html5Mod.default && typeof html5Mod.default === "object" && "Html5Qrcode" in html5Mod.default) {
          Html5Qrcode = html5Mod.default.Html5Qrcode;
        } else if (html5Mod.default && typeof html5Mod.default === "function") {
          Html5Qrcode = html5Mod.default as Html5QrcodeConstructor;
        } else {
          throw new Error("Не удалось найти Html5Qrcode в модуле. Проверьте установку пакета html5-qrcode.");
        }

        if (!Html5Qrcode || typeof Html5Qrcode !== "function") {
          throw new Error("Html5Qrcode не является функцией. Возможна проблема с версией пакета.");
        }

        // Проверяем актуальность попытки перед созданием сканера
        if (currentAttempt !== initAttemptRef.current) {
          console.debug("Init attempt outdated before camera access, skipping");
          isInitializingRef.current = false;
          return;
        }

        // Получаем список камер
        type CameraDevice = { id: string; label: string };
        let devices: CameraDevice[] = [];
        try {
          devices = await Html5Qrcode.getCameras();
        } catch (cameraError) {
          const cameraErrorMsg = cameraError instanceof Error ? cameraError.message : String(cameraError);
          throw new Error(`Ошибка доступа к камере: ${cameraErrorMsg}. Убедитесь, что у браузера есть разрешение на использование камеры.`);
        }

        if (devices.length === 0) {
          setError("Камера не найдена. Убедитесь, что у приложения есть доступ к камере и что камера подключена.");
          isInitializingRef.current = false;
          return;
        }

        // Предпочитаем заднюю камеру на мобильных устройствах
        const backCamera = devices.find((device) =>
          device.label?.toLowerCase().includes("back") ||
          device.label?.toLowerCase().includes("rear") ||
          device.label?.toLowerCase().includes("environment")
        );
        const selectedCamera = backCamera || devices[0];

        if (!selectedCamera || !selectedCamera.id) {
          throw new Error("Не удалось выбрать камеру");
        }

        // Финальная проверка актуальности перед созданием сканера
        if (currentAttempt !== initAttemptRef.current) {
          console.debug("Init attempt outdated before scanner creation, skipping");
          isInitializingRef.current = false;
          return;
        }

        const scanner = new Html5Qrcode(qrReaderId, {
          verbose: false,
        });

        scannerRef.current = scanner;

        // Адаптивный размер области сканирования
        // Получаем размеры контейнера (контейнер квадратный благодаря aspect-square)
        const containerElement = document.getElementById(qrReaderId);
        const containerWidth = containerElement?.clientWidth || Math.min(400, window.innerWidth - 80);
        const containerSize = containerWidth; // Для квадратного контейнера используем ширину

        // Размер qrbox должен быть меньше контейнера (квадратный)
        const qrboxSize = Math.min(250, containerSize - 40);

        await scanner.start(
          selectedCamera.id,
          {
            fps: 10,
            qrbox: { width: qrboxSize, height: qrboxSize },
            aspectRatio: 1.0,
            disableFlip: false,
          },
          (decodedText: string) => {
            const parsed = parseQrPayload(decodedText);

            if (parsed) {
              scanSuccessCallbackRef.current(parsed);
              stopScanner();
            } else {
              setError("Неверный формат QR-кода. Ожидается формат этикетки: тип:id (например, item:123).");
            }
          },
          (errorMessage: string) => {
            // Игнорируем ошибки поиска QR-кода (это нормально, пока не найден код)
            if (errorMessage && !errorMessage.includes("NotFoundException") && !errorMessage.includes("No QR code found")) {
              // Только логируем, не показываем пользователю
              console.debug("QR Scanner error:", errorMessage);
            }
          }
        );

        // Финальная проверка перед установкой состояния
        if (currentAttempt !== initAttemptRef.current) {
          console.debug("Init attempt outdated after start, stopping scanner");
          await stopScanner();
          return;
        }

        isScanningRef.current = true;
        setIsScanning(true);
        setError(null);
        isInitializingRef.current = false;
      } catch (err) {
        // Проверяем актуальность попытки перед обработкой ошибки
        if (currentAttempt !== initAttemptRef.current) {
          console.debug("Init attempt outdated, ignoring error");
          return;
        }

        console.error("QR Scanner initialization error:", err);
        let errorMessage = "Не удалось инициализировать сканер";

        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === "string") {
          errorMessage = err;
        }

        setError(errorMessage);
        isScanningRef.current = false;
        setIsScanning(false);
        isInitializingRef.current = false;
      }
    };

    initScanner();

    return () => {
      // Увеличиваем счетчик попыток при размонтировании, чтобы отменить текущую инициализацию
      initAttemptRef.current++;
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleNativeScan, onClose, parseQrPayload stable or intentionally excluded
  }, [open, qrReaderId, isNativePlatform, stopScanner]);

  const handleClose = useCallback((e?: React.MouseEvent) => {
    console.log("[QuickMove] QRScanner handleClose called", { hasEvent: !!e });
    // Останавливаем распространение события, чтобы оно не влияло на другие модальные окна
    if (e) {
      e.stopPropagation();
    }
    // Вызываем onClose сразу
    onClose();
    // Останавливаем сканер асинхронно после закрытия
    stopScanner().catch(() => {
      // Игнорируем ошибки при остановке
    });
  }, [stopScanner, onClose]);

  useEffect(() => {
    if (!open || isNativePlatform) return;

    // Ограничиваем z-index элементов, создаваемых html5-qrcode, но не меняем их позиционирование
    const style = document.createElement("style");
    style.id = `qr-scanner-styles-${qrReaderId}`;
    style.textContent = `
      #${qrReaderId} video {
        z-index: 1 !important;
        pointer-events: auto !important;
      }
      #${qrReaderId} canvas {
        z-index: 1 !important;
        pointer-events: auto !important;
      }
      #${qrReaderId} {
        pointer-events: auto !important;
        position: relative !important;
      }
      /* Убеждаемся, что рамка qrbox правильно позиционируется */
      #${qrReaderId} div[class*="qr-shaded-region"],
      #${qrReaderId} div[class*="qrbox"] {
        box-sizing: border-box !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(`qr-scanner-styles-${qrReaderId}`);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [open, qrReaderId, isNativePlatform]);

  const modalRef = useRef<HTMLDivElement>(null);

  if (!open || !mounted) {
    return null;
  }

  const content = (
    <>
      {/* Backdrop - блокирует клики на элементы на фоне */}
      <div
        className="fixed inset-0 z-[9999] bg-black/80"
      />
      {/* Контейнер с модальным окном */}
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center p-2"
        onClick={(e) => {
          const target = e.target as HTMLElement;
          const modal = modalRef.current;

          // Если клик был вне модального окна (на контейнере или backdrop), закрываем
          if (!modal || !modal.contains(target)) {
            handleClose(e);
          }
        }}
        style={{ pointerEvents: 'auto' }}
      >
        <div
          ref={modalRef}
          className="relative w-full max-w-md rounded-lg bg-background p-2 shadow-lg pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-2 right-4 z-[60] pointer-events-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleClose(e);
              }}
              aria-label="Закрыть сканер"
              className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative z-50 mb-4 flex items-center justify-between pointer-events-auto">
            <h3 className="text-lg font-semibold">Сканирование QR-кода</h3>
          </div>

          {!isNativePlatform && (
            <div
              ref={containerRef}
              id={qrReaderId}
              className={cn(
                "relative z-0 w-full overflow-hidden rounded-lg border aspect-square bg-muted"
              )}
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {error && (
            <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {!isScanning && !error && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{isNativePlatform ? "Готово к сканированию" : "Инициализация камеры..."}</span>
            </div>
          )}

          {isScanning && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {isNativePlatform ? "Открыта камера для сканирования..." : "Наведите камеру на QR-код"}
            </div>
          )}

          <div className={cn("relative z-[60] mt-4 flex justify-end pointer-events-auto", isNativePlatform && "justify-between")}>
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
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleClose(e);
              }}
              className="relative z-[60] pointer-events-auto bg-background"
            >
              Отмена
            </Button>
          </div>
        </div>
      </div>
    </>
  );

  // Используем Portal для полной изоляции от других модальных окон
  return createPortal(content, document.body);
};

export default QRScanner;
