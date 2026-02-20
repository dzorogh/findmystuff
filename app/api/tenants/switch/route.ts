import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/users/server";
import { createClient } from "@/lib/shared/supabase/server";
import { setTenantCookieInResponse } from "@/lib/tenants/server";

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await request.json();
    const tenantId = body?.tenantId;
    if (tenantId == null || typeof tenantId !== "number") {
      return NextResponse.json(
        { error: "tenantId required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tenant_memberships")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Тенант не найден или нет доступа" },
        { status: 403 }
      );
    }

    const res = NextResponse.json({ success: true });
    res.headers.set(
      "Set-Cookie",
      setTenantCookieInResponse(tenantId)
    );
    return res;
  } catch (err) {
    console.error("Error switching tenant:", err);
    return NextResponse.json(
      { error: "Ошибка переключения тенанта" },
      { status: 500 }
    );
  }
}
