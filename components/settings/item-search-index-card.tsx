"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { runItemSearchIndexBackfillBatch } from "@/lib/entities/items/search-index";

const DEFAULT_BATCH_LIMIT = 5;

export function ItemSearchIndexCard() {
  const [isRunning, setIsRunning] = useState(false);
  const [processedTotal, setProcessedTotal] = useState(0);
  const [batchCount, setBatchCount] = useState(0);
  const [statusText, setStatusText] = useState<string | null>(null);

  const detailsText = useMemo(() => {
    if (!statusText) {
      return "Перестраивает AI-индекс вещей и контейнеров для поиска по фото и умным совпадениям по названиям.";
    }
    return statusText;
  }, [statusText]);

  const handleReindex = async () => {
    setIsRunning(true);
    setProcessedTotal(0);
    setBatchCount(0);
    setStatusText("Запуск переиндексации...");

    let cursor: { entityType: "item" | "container"; afterId: number } | null = null;
    let total = 0;
    let batches = 0;

    try {
      while (true) {
        const nextBatchNumber = batches + 1;
        const cursorLabel =
          cursor?.entityType === "container" ? "контейнеров" : "вещей";
        setStatusText(
          total === 0
            ? `Запущен батч ${nextBatchNumber}. Первый ответ может занять время, если у сущностей есть фото.`
            : `Запущен батч ${nextBatchNumber}. Уже обработано ${total} сущностей, сейчас очередь ${cursorLabel}.`
        );

        const result = await runItemSearchIndexBackfillBatch({
          cursor,
          limit: DEFAULT_BATCH_LIMIT,
        });

        batches += 1;
        total += result.processed;
        setProcessedTotal(total);
        setBatchCount(batches);
        setStatusText(
          result.nextCursor == null
            ? `Готово. Обработано ${total} сущностей за ${batches} батч(ей).`
            : `Обработано ${total} сущностей, батч ${batches}...`
        );

        if (result.nextCursor == null) {
          toast.success(`Переиндексация завершена. Обработано ${total} сущностей.`);
          break;
        }

        cursor = result.nextCursor;
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Не удалось переиндексировать эмбединги";
      setStatusText(message);
      toast.error(message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">AI-поиск</h2>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>Переиндексация эмбедингов поиска</CardTitle>
              <p className="text-sm text-muted-foreground">{detailsText}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleReindex}
              disabled={isRunning}
            >
              {isRunning ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {isRunning ? "Индексируем..." : "Переиндексировать"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>Обработано: {processedTotal}</span>
            <span>Батчей: {batchCount}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
