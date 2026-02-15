/**
 * Серверные функции для получения наименования товара по штрихкоду EAN-13.
 * API: https://barcodes.olegon.ru
 * Вызываются из app/api/barcode-lookup/route.ts.
 */

const EAN_13_REGEX = /^\d{13}$/;
const BARCODES_API_BASE = "https://barcodes.olegon.ru/api/card/name";

interface BarcodesApiResponse {
  status?: number;
  names?: string[];
}

export async function lookupProductName(barcode: string): Promise<{ productName: string | null }> {
  if (!barcode?.trim() || !EAN_13_REGEX.test(barcode)) {
    return { productName: null };
  }

  const apiKey = process.env.BARCODES_API_KEY;
  if (!apiKey) {
    return { productName: null };
  }

  const url = `${BARCODES_API_BASE}/${encodeURIComponent(barcode)}/${encodeURIComponent(apiKey)}`;
  const response = await fetch(url);

  if (!response.ok) {
    return { productName: null };
  }

  const data = (await response.json()) as BarcodesApiResponse;
  const productName =
    data.names?.[0]?.trim() && data.names[0].length > 0 ? data.names[0] : null;
  return { productName };
}
