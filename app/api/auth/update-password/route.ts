import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { requireAuth } from "@/lib/shared/api/require-auth";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";

const MIN_PASSWORD_LENGTH = 6;

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const password = typeof body?.password === "string" ? body.password.trim() : "";

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Пароль должен быть не менее ${MIN_PASSWORD_LENGTH} символов` },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error, {
      context: "Ошибка смены пароля:",
      defaultMessage: "Произошла ошибка при смене пароля",
    });
  }
}
