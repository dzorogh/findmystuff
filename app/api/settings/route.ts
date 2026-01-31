import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";

export interface Setting {
  id: number;
  key: string;
  value: string;
  description: string | null;
  category: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error("Ошибка загрузки настроек:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Произошла ошибка при загрузке настроек",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const { key, value, isUserSetting } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: "Необходимы key и value" },
        { status: 400 }
      );
    }

    if (isUserSetting && !user?.id) {
      return NextResponse.json(
        { error: "Пользователь не авторизован" },
        { status: 401 }
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
        { status: 500 }
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
          { status: 500 }
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
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка обновления настройки:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Произошла ошибка при обновлении настройки",
      },
      { status: 500 }
    );
  }
}
