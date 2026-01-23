"use client";

import { useEffect, useRef, useState, useCallback, useId } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface QRScannerProps {
  onScanSuccess: (result: { type: "room" | "place" | "container"; id: number }) => void;
  onClose: () => void;
  open: boolean;
}

const QRScanner = ({ onScanSuccess, onClose, open }: QRScannerProps) => {
  const [mounted, setMounted] = useState(false);
  const scannerRef = useRef<any>(null);
  const isScanningRef = useRef(false);
  const isInitializingRef = useRef(false);
  const initAttemptRef = useRef(0);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scanSuccessCallbackRef = useRef(onScanSuccess);
  const qrReaderId = useId().replace(/:/g, "-"); // Уникальный ID для элемента сканера

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
          await scannerRef.current.stop().catch(() => {});
        }
        await scannerRef.current.clear().catch(() => {});
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
      return;
    }

    // Проверяем, что мы на клиенте
    if (typeof window === "undefined") {
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
        let Html5Qrcode: any;
        if (html5QrcodeModule.Html5Qrcode) {
          Html5Qrcode = html5QrcodeModule.Html5Qrcode;
        } else if ((html5QrcodeModule as any).default?.Html5Qrcode) {
          Html5Qrcode = (html5QrcodeModule as any).default.Html5Qrcode;
        } else if ((html5QrcodeModule as any).default) {
          Html5Qrcode = (html5QrcodeModule as any).default;
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
        let devices: any[] = [];
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
        // Получаем размеры контейнера
        const containerElement = document.getElementById(qrReaderId);
        const containerWidth = containerElement?.clientWidth || Math.min(400, window.innerWidth - 80);
        const containerHeight = containerElement?.clientHeight || 300;
        
        // Размер qrbox должен быть меньше контейнера
        const qrboxWidth = Math.min(250, containerWidth - 40);
        const qrboxHeight = Math.min(250, containerHeight - 40);

        await scanner.start(
          selectedCamera.id,
          {
            fps: 10,
            qrbox: { width: qrboxWidth, height: qrboxHeight },
            aspectRatio: 1.0,
            disableFlip: false,
          },
          (decodedText: string) => {
            try {
              const parsed = JSON.parse(decodedText);
              if (
                parsed.type &&
                (parsed.type === "room" || parsed.type === "place" || parsed.type === "container") &&
                typeof parsed.id === "number"
              ) {
                scanSuccessCallbackRef.current({
                  type: parsed.type,
                  id: parsed.id,
                });
                stopScanner();
              } else {
                setError("Неверный формат QR-кода. Ожидается JSON с полями type и id.");
              }
            } catch (parseError) {
              // Попробуем альтернативный формат: просто ID с префиксом типа
              const match = decodedText.match(/^(room|place|container):(\d+)$/);
              if (match) {
                scanSuccessCallbackRef.current({
                  type: match[1] as "room" | "place" | "container",
                  id: parseInt(match[2], 10),
                });
                stopScanner();
              } else {
                setError("Неверный формат QR-кода. Ожидается JSON или формат 'type:id'.");
              }
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
  }, [open, qrReaderId]);

  const handleClose = useCallback((e?: React.MouseEvent) => {
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
    if (!open) return;

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
  }, [open, qrReaderId]);

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
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
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
          className="relative w-full max-w-md rounded-lg bg-background p-4 shadow-lg pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="absolute top-4 right-4 z-[60] pointer-events-auto">
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

        <div
          ref={containerRef}
          id={qrReaderId}
          className={cn(
            "relative z-0 w-full overflow-hidden rounded-lg border",
            !isScanning && "min-h-[300px] bg-muted"
          )}
          onClick={(e) => e.stopPropagation()}
        />

        {error && (
          <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!isScanning && !error && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Инициализация камеры...</span>
          </div>
        )}

        {isScanning && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Наведите камеру на QR-код
          </div>
        )}

        <div className="relative z-[60] mt-4 flex justify-end pointer-events-auto">
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
