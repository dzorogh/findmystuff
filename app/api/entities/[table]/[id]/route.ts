import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { getServerUser } from "@/lib/users/server";

const ALLOWED_TABLES = ["items", "places", "containers", "rooms"];

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ table: string; id: string }> | { table: string; id: string } }
) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    const supabase = await createClient();
    const resolvedParams = await Promise.resolve(params);
    const { table, id: idString } = resolvedParams;

    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json(
        { error: "Недопустимая таблица" },
        { status: 400 }
      );
    }

    const id = parseInt(idString, 10);

    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: "Неверный ID" }, { status: 400 });
    }

    const { error } = await supabase
      .from(table)
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка мягкого удаления:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Произошла ошибка при удалении",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ table: string; id: string }> | { table: string; id: string } }
) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    const supabase = await createClient();
    const resolvedParams = await Promise.resolve(params);
    const { table, id: idString } = resolvedParams;

    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json(
        { error: "Недопустимая таблица" },
        { status: 400 }
      );
    }

    const id = parseInt(idString, 10);

    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: "Неверный ID" }, { status: 400 });
    }

    const { error } = await supabase
      .from(table)
      .update({ deleted_at: null })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка восстановления:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Произошла ошибка при восстановлении",
      },
      { status: 500 }
    );
  }
}
