import { NextRequest } from "next/server";
import * as qrcode from "qrcode";
import { getEntityDisplayName } from "@/lib/entities/helpers/display-name";
import { encodeEntityQrPayload } from "@/lib/entities/helpers/qr-code";
import type { EntityTypeName } from "@/types/entity";

const LABEL_WIDTH_MM = 62;
const LABEL_HEIGHT_MM = 29;
const VALID_ENTITY_TYPES: EntityTypeName[] = ["item", "place", "container", "room"];

const htmlResponse = (html: string, status = 200): Response =>
  new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, max-age=0",
    },
  });

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const parseEntityType = (value: string | null): EntityTypeName | null => {
  if (!value) return null;
  return VALID_ENTITY_TYPES.includes(value as EntityTypeName)
    ? (value as EntityTypeName)
    : null;
};

const parseEntityId = (value: string | null): number | null => {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const buildErrorHtml = (message: string): string => `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ошибка печати</title>
</head>
<body>
  <p>${escapeHtml(message)}</p>
</body>
</html>`;

const buildLabelHtml = (
  qrDataUrl: string,
  entityType: EntityTypeName,
  entityId: number,
  name: string | null,
  createdAt: string
): string => {
  const payload = encodeEntityQrPayload(entityType, entityId);
  const shortLabel = getEntityDisplayName(entityType, entityId, name);

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Этикетка #${entityId} — ${LABEL_WIDTH_MM}×${LABEL_HEIGHT_MM} мм</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      overflow: hidden;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 8px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      width: ${LABEL_WIDTH_MM}mm;
      height: ${LABEL_HEIGHT_MM}mm;
    }
    .label-wrapper {
      width: 100%;
      height: 100%;
      padding: 3mm 1.5mm;
    }
    .label-content {
      display: flex;
      width: 100%;
      height: 100%;
      border: 1px solid #000;
      border-radius: 2mm;
      align-items: center;
      justify-content: center;
    }
    .label-qr {
      flex-shrink: 0;
      height: 100%;
      border-right: 1px solid #000;
      padding: 2mm;
    }
    .label-qr img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
    .label-info {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-width: 0;
      height: 100%;
      font-weight: 600;
      text-align: left;
      word-break: break-all;
      justify-content: center;
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
      }
    }
  </style>
  <script>
    (() => {
      const printNow = () => {
        setTimeout(() => {
          window.focus();
          window.print();
        }, 120);
      };

      if (document.readyState === "complete") {
        printNow();
      } else {
        window.addEventListener("load", printNow, { once: true });
      }

      window.addEventListener("afterprint", () => {
        setTimeout(() => window.close(), 300);
      }, { once: true });
    })();
  </script>
</head>
<body>
  <div class="label-wrapper">
    <div class="label-content">
      <div class="label-qr">
        <img src="${qrDataUrl}" alt="" width="260" height="260" />
      </div>
      <div class="label-info">
        <div class="label-id">${escapeHtml(payload)}</div>
        <div class="label-title">${escapeHtml(shortLabel)}</div>
        <div class="label-created-at">${escapeHtml(createdAt)}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
};

export async function GET(request: NextRequest): Promise<Response> {
  const params = request.nextUrl.searchParams;
  const entityType = parseEntityType(params.get("entityType"));
  const entityId = parseEntityId(params.get("entityId"));
  const name = params.get("name");
  const createdAt =
    params.get("createdAt") ||
    new Date().toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (!entityType || !entityId) {
    return htmlResponse(
      buildErrorHtml("Неверные параметры печати. Проверьте entityType и entityId."),
      400
    );
  }

  try {
    const payload = encodeEntityQrPayload(entityType, entityId);
    const qrDataUrl = await qrcode.toDataURL(payload, {
      width: 260,
      margin: 0,
      errorCorrectionLevel: "M",
    });

    return htmlResponse(
      buildLabelHtml(qrDataUrl, entityType, entityId, name, createdAt)
    );
  } catch (error) {
    return htmlResponse(
      buildErrorHtml(
        error instanceof Error ? error.message : "Не удалось сгенерировать этикетку."
      ),
      500
    );
  }
}
