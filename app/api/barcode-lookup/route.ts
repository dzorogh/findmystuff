import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/users/server";
import { lookupProductName } from "@/lib/shared/api/barcode-lookup-server";

const EAN_13_REGEX = /^\d{13}$/;

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

    const { productName } = await lookupProductName(barcode);
    return NextResponse.json({ productName });
  } catch (error) {
    console.error("barcode-lookup error:", error);
    return NextResponse.json({ productName: null });
  }
}
