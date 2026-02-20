import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { getSupabaseAdmin } from "@/lib/shared/supabase/admin";
import { seedDefaultEntityTypesForTenant } from "@/lib/tenants/seed-default-entity-types";
import { getServerUser } from "@/lib/users/server";

export async function GET() {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const tenants = (data ?? [])
      .map((row: { tenant: unknown }) => row.tenant)
      .filter((t): t is { id: number; name: string | null; created_at: string; deleted_at: string | null } => t != null)
      .filter((t) => !t.deleted_at)
      .map(({ id, name, created_at }) => ({ id, name, created_at }));

    return NextResponse.json(tenants);
  } catch (err) {
    console.error("Error fetching tenants:", err);
    return NextResponse.json(
      { error: "Ошибка загрузки тенантов" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await request.json();
    const name = body?.name?.trim() ?? "Мой склад";

    const supabase = await createClient();
    const { data: tenant, error } = await supabase.rpc("create_tenant_for_current_user", {
      p_name: name,
    });

    if (error || !tenant) {
      return NextResponse.json(
        { error: error?.message ?? "Ошибка создания тенанта" },
        { status: 500 }
      );
    }

    const row = tenant as { id: number; name: string | null; created_at: string };

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
  } catch (err) {
    console.error("Error creating tenant:", err);
    return NextResponse.json(
      { error: "Ошибка создания тенанта" },
      { status: 500 }
    );
  }
}
