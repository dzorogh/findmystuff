import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { getSupabaseAdmin } from "@/lib/shared/supabase/admin";
import { createTenantForCurrentUserRpc } from "@/lib/tenants/api";
import { seedDefaultEntityTypesForTenant } from "@/lib/tenants/seed-default-entity-types";
import { requireAuth } from "@/lib/shared/api/require-auth";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tenant_memberships")
      .select(
        `
        tenant:tenants (
          id,
          name,
          created_at,
          deleted_at
        )
      `
      )
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    const tenants = (data ?? [])
      .map((row: { tenant: unknown }) => row.tenant)
      .filter((t): t is { id: number; name: string | null; created_at: string; deleted_at: string | null } => t != null)
      .filter((t) => !t.deleted_at)
      .map(({ id, name, created_at }) => ({ id, name, created_at }));

    return NextResponse.json(tenants);
  } catch (error) {
    return apiErrorResponse(error, {
      context: "Ошибка загрузки тенантов:",
      defaultMessage: "Произошла ошибка при загрузке тенантов",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { user: _user } = auth;

    const body = await request.json();
    const name = body?.name?.trim() ?? "Мой склад";

    const supabase = await createClient();
    let row: { id: number; name: string | null; created_at: string };
    try {
      row = await createTenantForCurrentUserRpc(supabase, name);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Ошибка создания тенанта";
      return NextResponse.json(
        { error: message },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    try {
      const admin = getSupabaseAdmin();
      await seedDefaultEntityTypesForTenant(admin, row.id);
    } catch (seedErr) {
      console.error("Failed to seed default entity types:", seedErr);
    }

    return NextResponse.json(
      { id: row.id, name: row.name, created_at: row.created_at },
      { status: 201 }
    );
  } catch (error) {
    return apiErrorResponse(error, {
      context: "Ошибка создания тенанта:",
      defaultMessage: "Произошла ошибка при создании тенанта",
    });
  }
}
