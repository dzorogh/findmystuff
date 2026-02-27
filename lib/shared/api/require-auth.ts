/**
 * Хелперы для API-маршрутов: проверка авторизации и тенанта.
 * Возвращают данные или NextResponse с ошибкой (401/400).
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getServerUser } from "@/lib/users/server";
import { getActiveTenantId } from "@/lib/tenants/server";
import { HTTP_STATUS } from "./http-status";

export async function requireAuth(
  _request: NextRequest
): Promise<{ user: User } | NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  return { user };
}

export async function requireTenant(
  request: NextRequest
): Promise<{ tenantId: number } | NextResponse> {
  const tenantId = await getActiveTenantId(request.headers);
  if (!tenantId) {
    return NextResponse.json(
      { error: "Выберите тенант или создайте склад" },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }
  return { tenantId };
}

/** Проверяет и пользователя, и тенанта. Удобно для маршрутов, которым нужны оба. */
export async function requireAuthAndTenant(
  request: NextRequest
): Promise<
  | { user: User; tenantId: number }
  | NextResponse
> {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const tenant = await requireTenant(request);
  if (tenant instanceof NextResponse) return tenant;
  return { user: auth.user, tenantId: tenant.tenantId };
}
