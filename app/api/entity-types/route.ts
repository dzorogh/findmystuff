import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { requireAuthAndTenant } from "@/lib/shared/api/require-auth";
import { validateEntityCategory } from "@/lib/shared/api/validate-entity-category";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthAndTenant(request);
    if (auth instanceof NextResponse) return auth;
    const { tenantId } = auth;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let query = supabase
      .from("entity_types")
      .select("*")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("name", { ascending: true });

    const validatedCategory = validateEntityCategory(category);
    if (validatedCategory instanceof NextResponse) return validatedCategory;
    if (validatedCategory) {
      query = query.eq("entity_category", validatedCategory);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
    }

    return NextResponse.json({ data });
  } catch (error) {
    const isTimeout =
      error instanceof Error &&
      (error.cause as NodeJS.ErrnoException)?.code === "ETIMEDOUT";
    const isAbort = error instanceof Error && error.name === "AbortError";
    if (isTimeout || isAbort) {
      return NextResponse.json(
        {
          error:
            "Сервер данных не ответил вовремя. Проверьте подключение или попробуйте позже.",
        },
        { status: HTTP_STATUS.SERVICE_UNAVAILABLE }
      );
    }
    return apiErrorResponse(error, { defaultMessage: "Произошла ошибка" });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthAndTenant(request);
    if (auth instanceof NextResponse) return auth;
    const { tenantId } = auth;
    const supabase = await createClient();
    const body = await request.json();
    const { entity_category, name } = body;

    if (!entity_category || !name) {
      return NextResponse.json(
        { error: "Необходимы поля: entity_category, name" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const validatedCategory = validateEntityCategory(entity_category);
    if (validatedCategory instanceof NextResponse) return validatedCategory;
    if (validatedCategory === null) {
      return NextResponse.json(
        { error: "Необходимы поля: entity_category, name" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { data, error } = await supabase
      .from("entity_types")
      .insert({ tenant_id: tenantId, entity_category: validatedCategory, name })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return apiErrorResponse(error, { defaultMessage: "Произошла ошибка" });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuthAndTenant(request);
    if (auth instanceof NextResponse) return auth;
    const { tenantId } = auth;
    const supabase = await createClient();
    const body = await request.json();
    const { id, name } = body;

    if (!id) {
      return NextResponse.json({ error: "Необходим id" }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    const updateData: { name?: string } = {};
    if (name !== undefined) updateData.name = name;

    const { data, error } = await supabase
      .from("entity_types")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return apiErrorResponse(error, { defaultMessage: "Произошла ошибка" });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuthAndTenant(request);
    if (auth instanceof NextResponse) return auth;
    const { tenantId } = auth;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Необходим id" }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    const { error } = await supabase
      .from("entity_types")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error, { defaultMessage: "Произошла ошибка" });
  }
}
