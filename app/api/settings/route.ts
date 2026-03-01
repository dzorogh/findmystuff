import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { getServerUser } from "@/lib/users/server";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";

export async function GET(_request: NextRequest) {
  try {
    const user = await getServerUser();
    const supabase = await createClient();

    // Загружаем персональные настройки пользователя и глобальные (где user_id IS NULL)
    let query = supabase
      .from("settings")
      .select("*");

    if (user?.id) {
      query = query.or(`user_id.eq.${user.id},user_id.is.null`);
    } else {
      query = query.is("user_id", null);
    }

    const { data, error: fetchError } = await query
      .order("category", { ascending: true })
      .order("key", { ascending: true });

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    return apiErrorResponse(error, {
      context: "Ошибка загрузки настроек:",
      defaultMessage: "Произошла ошибка при загрузке настроек",
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getServerUser();
    const supabase = await createClient();

    const body = await request.json();
    const { key, value, isUserSetting } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: "Необходимы key и value" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (isUserSetting && !user?.id) {
      return NextResponse.json(
        { error: "Пользователь не авторизован" },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const userId = isUserSetting ? user?.id ?? null : null;

    // Проверяем, существует ли настройка
    const { data: existing, error: checkError } = await supabase
      .from("settings")
      .select("id")
      .eq("key", key)
      .eq("user_id", userId)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      return NextResponse.json(
        { error: checkError.message },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    if (existing) {
      // Обновляем существующую настройку
      const { error: updateError } = await supabase
        .from("settings")
        .update({ value })
        .eq("key", key)
        .eq("user_id", userId);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
      }
    } else {
      // Создаем новую настройку
      const { error: insertError } = await supabase
        .from("settings")
        .insert({
          key,
          value,
          category: isUserSetting ? "account" : "marking",
          description: null,
          user_id: userId,
        });

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error, {
      context: "Ошибка обновления настройки:",
      defaultMessage: "Произошла ошибка при обновлении настройки",
    });
  }
}
