/**
 * Печать этикетки для сущности с QR-кодом (тип сущности + id).
 * Размер этикетки: 62×29 мм — минимальная длина для Brother QL-810W при ленте 62 мм.
 * Формат QR: см. lib/entity-qr-code.ts
 */

import { getEntityDisplayName } from "@/lib/entity-display-name";
import { encodeEntityQrPayload } from "@/lib/entity-qr-code";

import type { EntityTypeName } from "@/types/entity";

const LABEL_WIDTH_MM = 62;
const LABEL_HEIGHT_MM = 29;

const buildLabelHtml = (qrDataUrl: string, entityType: EntityTypeName, entityId: number, name: string | null, createdAt: string | null): string => {
  const shortLabel = getEntityDisplayName(entityType, entityId, name);
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Этикетка #${entityId} — 62×29 мм</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      overflow: hidden;
      font-family: "Geist Mono", system-ui, -apple-system, sans-serif;
      font-size: 8px;
      padding: 0;
      margin: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .label-content {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      border: 1px solid #000;
      border-radius: 2mm;
    }
    .label-qr {
      flex-shrink: 0;
      height: 100%;
      border-right: 1px solid #000;
      padding: 2mm;
    }
    .label-qr img {
      height: 100%;
      width: 100%;
      object-fit: contain;
      display: block;
    }
    .label-info {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-width: 0;
      font-weight: 600;
      word-break: break-all;
      text-align: left;
      justify-content: center;
      flex-grow: 1;
      height: 100%;
    }
    .label-id {
      border-bottom: 1px solid #000;
      padding: 1mm;
    }
    .label-title {
      border-bottom: 1px solid #000;
      padding: 1mm;
      flex-grow: 1;
    }
    .label-created-at {
      padding: 1mm;
    }
    .label-wrapper {
      padding: 3mm 1.5mm;
      width: 100%;
      height: 100%;
    }
    @media print {
      @page {
        size: ${LABEL_WIDTH_MM}mm ${LABEL_HEIGHT_MM}mm;
        margin: 0;
      }
      html, body {
        width: ${LABEL_WIDTH_MM}mm !important;
        height: ${LABEL_HEIGHT_MM}mm !important;
        min-width: ${LABEL_WIDTH_MM}mm;
        min-height: ${LABEL_HEIGHT_MM}mm;
        overflow: hidden;
      }
    }
  </style>
</head>
<body>
  <div class="label-wrapper">
    <div class="label-content">
      <div class="label-qr">
        <img src="${qrDataUrl}" alt="" width="260" height="260" />
      </div>
      <div class="label-info">
        <div class="label-id">${encodeEntityQrPayload(entityType, entityId)}</div>
        <div class="label-title">${shortLabel}</div>
        <div class="label-created-at">${createdAt || ""}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Печатает этикетку для сущности (Brother QL-810W, 62×29 мм) через скрытый iframe.
 * В QR записан payload вида "item:123", "place:456", "container:789", "room:1" (тип и id).
 * Не использует window.open — диалог печати открывается в той же вкладке, без блокировок всплывающих окон.
 */
export const printEntityLabel = async (
  entityType: EntityTypeName,
  entityId: number,
  name: string | null
): Promise<void> => {
  if (typeof window === "undefined" || !document.body) {
    return;
  }

  const createdAt = new Date().toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const payload = encodeEntityQrPayload(entityType, entityId);

  const qrcode = await import("qrcode");
  const qrDataUrl = await qrcode.toDataURL(payload, {
    width: 260,
    margin: 0,
    errorCorrectionLevel: "M",
  });

  const html = buildLabelHtml(qrDataUrl, entityType, entityId, name, createdAt);

  const iframe = document.createElement("iframe");
  iframe.setAttribute("style", "position:fixed;left:-9999px;width:0;height:0;border:none;");
  iframe.setAttribute("title", "Печать этикетки");
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    iframe.remove();
    throw new Error("Не удалось подготовить окно печати.");
  }

  const removeIframe = (): void => {
    if (iframe.parentNode) {
      iframe.remove();
    }
  };

  iframe.addEventListener("load", () => {
    const win = iframe.contentWindow;
    if (win) {
      win.focus();
      win.print();
      win.onafterprint = removeIframe;
    }
    setTimeout(removeIframe, 5000);
  });

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();
};

/** Печатает этикетку для вещи. Оставлен для обратной совместимости. */
export const printItemLabel = (
  entityId: number,
  name: string | null
): Promise<void> => printEntityLabel("item", entityId, name);
