import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/users/server";
import * as cheerio from "cheerio";

const EAN_13_REGEX = /^\d{13}$/;
const BARCODE_LIST_URL = "https://barcode-list.ru/barcode/RU/Поиск.htm";

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get("barcode")?.trim();

    if (!barcode || !EAN_13_REGEX.test(barcode)) {
      return NextResponse.json(
        { error: "Некорректный штрих-код. Ожидается 13 цифр (EAN-13)." },
        { status: 400 }
      );
    }

    const url = `${BARCODE_LIST_URL}?barcode=${encodeURIComponent(barcode)}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ productName: null });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const productNameCell = $("table.randomBarcodes tr:nth-child(2) td:nth-child(3)")
      .first()
      .text()
      ?.trim();

    const productName = productNameCell && productNameCell.length > 0 ? productNameCell : null;

    return NextResponse.json({ productName });
  } catch (error) {
    console.error("barcode-lookup error:", error);
    return NextResponse.json({ productName: null });
  }
}
