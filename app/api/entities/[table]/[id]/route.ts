import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { requireAuthAndTenant } from "@/lib/shared/api/require-auth";
import { parseId } from "@/lib/shared/api/parse-id";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";

const ALLOWED_TABLES = ["items", "places", "containers", "rooms", "buildings", "furniture"];

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ table: string; id: string }> | { table: string; id: string } }
) {
  try {
    const auth = await requireAuthAndTenant(request);
    if (auth instanceof NextResponse) return auth;
    const { tenantId: _tenantId } = auth;
    const supabase = await createClient();
    const resolvedParams = await Promise.resolve(params);
    const { table, id: idString } = resolvedParams;

    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json(
        { error: "Недопустимая таблица" },
        { status: 400 }
      );
    }

    const idResult = parseId(idString, { entityLabel: "сущности" });
    if (idResult instanceof NextResponse) return idResult;
    const id = idResult.id;

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
    return apiErrorResponse(error, {
      context: "Ошибка мягкого удаления:",
      defaultMessage: "Произошла ошибка при удалении",
    });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ table: string; id: string }> | { table: string; id: string } }
) {
  try {
    const auth = await requireAuthAndTenant(request);
    if (auth instanceof NextResponse) return auth;
    const { tenantId: _tenantId } = auth;
    const supabase = await createClient();
    const resolvedParams = await Promise.resolve(params);
    const { table, id: idString } = resolvedParams;

    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json(
        { error: "Недопустимая таблица" },
        { status: 400 }
      );
    }

    const idResult = parseId(idString, { entityLabel: "сущности" });
    if (idResult instanceof NextResponse) return idResult;
    const id = idResult.id;

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
    return apiErrorResponse(error, {
      context: "Ошибка восстановления:",
      defaultMessage: "Произошла ошибка при восстановлении",
    });
  }
}
