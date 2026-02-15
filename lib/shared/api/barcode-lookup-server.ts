/**
 * Серверные функции для получения наименования товара по штрихкоду EAN-13.
 * Вызываются из app/api/barcode-lookup/route.ts.
 */

import * as cheerio from "cheerio";

const EAN_13_REGEX = /^\d{13}$/;
const BARCODE_LIST_URL = "https://barcode-list.ru/barcode/RU/Поиск.htm";

export async function lookupProductName(barcode: string): Promise<{ productName: string | null }> {
  if (!barcode?.trim() || !EAN_13_REGEX.test(barcode)) {
    return { productName: null };
  }

  const url = `${BARCODE_LIST_URL}?barcode=${encodeURIComponent(barcode)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    return { productName: null };
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const productNameCell = $("table.randomBarcodes tr:nth-child(2) td:nth-child(3)")
    .first()
    .text()
    ?.trim();

  const productName = productNameCell && productNameCell.length > 0 ? productNameCell : null;
  return { productName };
}
