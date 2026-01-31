"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { getItem, createTransition } from "@/lib/entities/api";
import { getContainer } from "@/lib/containers/api";
import { getPlace } from "@/lib/places/api";
import { getRoom } from "@/lib/rooms/api";
import { resolveQuickMove, type QuickMoveResult } from "@/lib/entities/helpers/quick-move";
import type { EntityQrPayload } from "@/lib/entities/helpers/qr-code";
import { getEntityDisplayName } from "@/lib/entities/helpers/display-name";
import type { EntityTypeName } from "@/types/entity";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import QRScanner from "@/components/common/qr-scanner";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Step = "scan_first" | "scan_second" | "submitting";

interface QuickMoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const fetchEntityName = async (
  entityType: EntityTypeName,
  entityId: number
): Promise<string> => {
  try {
    if (entityType === "item") {
      const res = await getItem(entityId, false);
      if (res.error || !res.data) {
        return getEntityDisplayName(entityType, entityId, null);
      }
      const name = res.data.item?.name ?? null;
      return getEntityDisplayName(entityType, entityId, name);
    }
    if (entityType === "container") {
      const res = await getContainer(entityId);
      if (res.error || !res.data) {
        return getEntityDisplayName(entityType, entityId, null);
      }
      const name = res.data.container?.name ?? null;
      return getEntityDisplayName(entityType, entityId, name);
    }
    if (entityType === "place") {
      const res = await getPlace(entityId);
      if (res.error || !res.data) {
        return getEntityDisplayName(entityType, entityId, null);
      }
      const name = res.data.place?.name ?? null;
      return getEntityDisplayName(entityType, entityId, name);
    }
    if (entityType === "room") {
      const res = await getRoom(entityId);
      if (res.error || !res.data) {
        return getEntityDisplayName(entityType, entityId, null);
      }
      const name = res.data.room?.name ?? null;
      return getEntityDisplayName(entityType, entityId, name);
    }
  } catch {
    // ignore
  }
  return getEntityDisplayName(entityType, entityId, null);
};

/** Логи только при открытом диалоге, чтобы не засорять консоль при загрузке. */
const LOG = (open: boolean, msg: string, data?: object) => {
  if (open) {
    console.log("[QuickMove]", msg, data ?? "");
  }
};

const QuickMoveDialogInner = ({ open, onOpenChange, onSuccess }: QuickMoveDialogProps) => {
  const [step, setStep] = useState<Step>("scan_first");
  const [first, setFirst] = useState<EntityQrPayload | null>(null);
  const [_second, setSecond] = useState<EntityQrPayload | null>(null);
  const [move, setMove] = useState<QuickMoveResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scannerRemountKey, setScannerRemountKey] = useState(0);
  const lastScanTimeRef = useRef(0);
  const IGNORE_CLOSE_MS = 150;

  const resetState = useCallback(() => {
    LOG(true, "resetState");
    setStep("scan_first");
    setFirst(null);
    setSecond(null);
    setMove(null);
    setError(null);
    setScannerRemountKey((k) => k + 1);
  }, []);

  useEffect(() => {
    LOG(open, "useEffect [open]", { open });
    if (open) {
      resetState();
    }
  }, [open, resetState]);

  const handleClose = useCallback(() => {
    LOG(true, "handleClose called");
    flushSync(() => {
      onOpenChange(false);
      LOG(true, "handleClose: onOpenChange(false) done");
    });
    resetState();
    LOG(true, "handleClose: resetState done");
  }, [onOpenChange, resetState]);

  const handleScannerClose = useCallback(() => {
    const now = Date.now();
    const sinceScan = now - lastScanTimeRef.current;
    LOG(true, "handleScannerClose called", { sinceScan });
    if (sinceScan < IGNORE_CLOSE_MS) {
      LOG(true, "handleScannerClose: ignored (recent scan), returning");
      return;
    }
    LOG(true, "handleScannerClose: calling handleClose()");
    handleClose();
  }, [handleClose]);

  const handleFirstScan = useCallback((payload: EntityQrPayload) => {
    lastScanTimeRef.current = Date.now();
    setFirst(payload);
    setStep("scan_second");
  }, []);

  const doSubmit = useCallback(
    async (moveResult: QuickMoveResult) => {
      setError(null);
      try {
        const payload: {
          item_id?: number;
          place_id?: number;
          container_id?: number;
          destination_type: string;
          destination_id: number;
        } = {
          destination_type: moveResult.destType,
          destination_id: moveResult.destId,
        };
        if (moveResult.sourceType === "item") {
          payload.item_id = moveResult.sourceId;
        } else if (moveResult.sourceType === "place") {
          payload.place_id = moveResult.sourceId;
        } else if (moveResult.sourceType === "container") {
          payload.container_id = moveResult.sourceId;
        }
        const response = await createTransition(payload);
        if (response.error) {
          throw new Error(response.error);
        }
        const destLabel =
          (await fetchEntityName(moveResult.destType, moveResult.destId)) ??
          getEntityDisplayName(moveResult.destType, moveResult.destId, null);
        toast.success(`Успешно перемещено в ${destLabel}`, {
          description: "Перемещение выполнено",
        });
        if (onSuccess) {
          onSuccess();
        }
        handleClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка при перемещении");
      }
    },
    [onSuccess, handleClose]
  );

  const handleRetry = useCallback(() => {
    if (move) {
      doSubmit(move);
    }
  }, [move, doSubmit]);

  const handleSecondScan = useCallback(
    (payload: EntityQrPayload) => {
      if (!first) {
        return;
      }
      const isSameEntity = payload.type === first.type && payload.id === first.id;
      if (isSameEntity) {
        lastScanTimeRef.current = Date.now();
        toast.error("Отсканирована та же сущность", {
          description: "Отсканируйте другую сущность (другой QR-код)",
        });
        setScannerRemountKey((k) => k + 1);
        return;
      }
      if (payload.type === first.type) {
        lastScanTimeRef.current = Date.now();
        toast.error("Нужна сущность другого типа", {
          description: "Отсканируйте QR-код вещи, контейнера, места или помещения другого типа",
        });
        setScannerRemountKey((k) => k + 1);
        return;
      }
      lastScanTimeRef.current = Date.now();
      setSecond(payload);
      const result = resolveQuickMove(first, payload);
      if (!result) {
        toast.error("Невозможно определить перемещение");
        return;
      }
      setMove(result);
      setStep("submitting");
      setError(null);
      doSubmit(result);
    },
    [first, doSubmit]
  );

  const handleScanSuccess = useCallback(
    (payload: EntityQrPayload) => {
      if (step === "scan_first") {
        handleFirstScan(payload);
        return;
      }
      if (step === "scan_second") {
        handleSecondScan(payload);
      }
    },
    [step, handleFirstScan, handleSecondScan]
  );

  const showScanner = step === "scan_first" || step === "scan_second";

  LOG(open, "render", { open, step, showScanner });

  // На шагах сканирования — один слой: непрозрачный фон в body скрывает приложение,
  // поверх только сканер. Так не видно сайдбар/контент под сканером.
  if (open && showScanner) {
    LOG(open, "render: return scanner + backdrop");
    return (
      <>
        <QRScanner
          key={`${step}-${scannerRemountKey}`}
          open={true}
          onClose={handleScannerClose}
          onScanSuccess={handleScanSuccess}
        />
      </>
    );
  }

  if (!open) {
    LOG(open, "render: return null (!open)");
    return null;
  }

  LOG(open, "render: return Dialog (submitting step)");
  return (
    <Dialog open={true} onOpenChange={(newOpen) => !newOpen && handleClose()}>
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Быстрое перемещение</DialogTitle>
          <DialogDescription id="quick-move-desc">
            {error
              ? "Ошибка при перемещении. Можно повторить или отменить."
              : "Выполняется перемещение…"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-sm text-destructive py-2" role="alert">
            {error}
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetState();
              setStep("scan_first");
            }}
            disabled={!error}
          >
            Отмена
          </Button>
          {error && (
            <Button type="button" onClick={handleRetry} aria-label="Повторить перемещение">
              Повторить
            </Button>
          )}
          {!error && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              <span>Отправка…</span>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const QuickMoveDialog = React.memo(QuickMoveDialogInner);

export default QuickMoveDialog;
