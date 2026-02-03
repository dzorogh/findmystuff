import * as qrcode from "qrcode";
import { getEntityDisplayName } from "@/lib/entities/helpers/display-name";
import { encodeEntityQrPayload } from "@/lib/entities/helpers/qr-code";
import type { EntityTypeName } from "@/types/entity";
import { PrintAutoActions } from "./print-auto-actions";
import Image from "next/image";

const VALID_ENTITY_TYPES: EntityTypeName[] = ["item", "place", "container", "room"];

type SearchParams = Record<string, string | string[] | undefined>;

type PrintLabelPageProps = {
  searchParams?: Promise<SearchParams> | SearchParams;
};

const getParam = (params: SearchParams, key: string): string | null => {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
};

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

const getCreatedAt = (value: string | null): string =>
  value ||
  new Date().toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export const dynamic = "force-dynamic";

export default async function PrintLabelPage({ searchParams }: PrintLabelPageProps) {
  const resolvedParams = await Promise.resolve(searchParams ?? {});
  const entityType = parseEntityType(getParam(resolvedParams, "entityType"));
  const entityId = parseEntityId(getParam(resolvedParams, "entityId"));
  const name = getParam(resolvedParams, "name");
  const createdAt = getCreatedAt(getParam(resolvedParams, "createdAt"));

  if (!entityType || !entityId) {
    return (
      <div className="p-3 font-mono text-xs">
        Неверные параметры печати. Проверьте `entityType` и `entityId`.
      </div>
    );
  }

  const payload = encodeEntityQrPayload(entityType, entityId);
  const shortLabel = getEntityDisplayName(entityType, entityId, name);

  let qrDataUrl: string | null = null;
  let qrErrorMessage: string | null = null;
  try {
    qrDataUrl = await qrcode.toDataURL(payload, {
      width: 260,
      margin: 0,
      errorCorrectionLevel: "M",
    });
  } catch (error) {
    qrErrorMessage = error instanceof Error ? error.message : "Не удалось сгенерировать этикетку.";
  }

  if (!qrDataUrl) {
    return (
      <div className="p-3 font-mono text-xs">
        {qrErrorMessage || "Не удалось сгенерировать этикетку."}
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: 62mm 29mm;
            margin: 0;
          }
        }
      `}</style>
      <div className="h-[29mm] w-[62mm] overflow-hidden font-mono text-[8px] [print-color-adjust:exact] [-webkit-print-color-adjust:exact] print:!h-[29mm] print:!w-[62mm]">
        <PrintAutoActions />
        <div className="h-full w-full p-[3mm_1.5mm]">
          <div className="flex h-full w-full items-center justify-center rounded-[2mm] border border-black">
            <div className="relative h-full shrink-0 border-r border-black p-[2mm] aspect-square">
              <div className="h-full w-full relative">
                <Image src={qrDataUrl} alt="" fill className="object-contain" />
              </div>
            </div>
            <div className="flex h-full min-w-0 flex-1 flex-col justify-center break-all text-left font-semibold">
              <div className="border-b border-black p-[1mm]">{payload}</div>
              <div className="grow border-b border-black p-[1mm]">{shortLabel}</div>
              <div className="p-[1mm]">{createdAt}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
