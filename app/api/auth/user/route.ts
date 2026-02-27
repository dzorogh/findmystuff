import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/users/server";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";

export async function GET() {
  try {
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json(
        { error: "Не авторизован" },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    return NextResponse.json({ data: { user } });
  } catch (error) {
    return apiErrorResponse(error, {
      context: "Ошибка получения пользователя:",
      defaultMessage: "Произошла ошибка при получении пользователя",
    });
  }
}
