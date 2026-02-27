import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/users/server";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";
import { lookupProductName } from "@/lib/shared/api/barcode-lookup-server";

const EAN_13_REGEX = /^\d{13}$/;

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: HTTP_STATUS.UNAUTHORIZED });
    }

    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get("barcode")?.trim();

    if (!barcode || !EAN_13_REGEX.test(barcode)) {
      return NextResponse.json(
        { error: "Некорректный штрих-код. Ожидается 13 цифр (EAN-13)." },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { productName } = await lookupProductName(barcode);
    return NextResponse.json({ productName });
  } catch (error) {
    return apiErrorResponse(error, {
      context: "barcode-lookup error:",
      defaultMessage: "Ошибка при поиске по штрих-коду",
    });
  }
}
