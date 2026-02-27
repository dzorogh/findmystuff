import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { setTenantCookieInResponse } from "@/lib/tenants/server";
import { requireAuth } from "@/lib/shared/api/require-auth";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const body = await request.json();
    const raw = body?.tenantId;
    const tenantIdNum =
      typeof raw === "number"
        ? raw
        : typeof raw === "string"
          ? parseInt(raw, 10)
          : NaN;
    if (!Number.isInteger(tenantIdNum) || tenantIdNum <= 0) {
      return NextResponse.json(
        { error: "tenantId required" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }
    const tenantId = tenantIdNum;

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
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    const res = NextResponse.json({ success: true });
    res.headers.set(
      "Set-Cookie",
      setTenantCookieInResponse(tenantId)
    );
    return res;
  } catch (error) {
    return apiErrorResponse(error, {
      context: "Ошибка переключения тенанта:",
      defaultMessage: "Произошла ошибка при переключении тенанта",
    });
  }
}
