/**
 * Server-side tenant utilities — getActiveTenantId from cookie/header
 * Used by API routes.
 */

import { cookies } from "next/headers";

const TENANT_COOKIE = "tenant_id";
const TENANT_HEADER = "x-tenant-id";

export async function getActiveTenantId(
  headers?: Headers
): Promise<number | null> {
  if (headers?.get(TENANT_HEADER)) {
    const id = parseInt(headers.get(TENANT_HEADER)!, 10);
    if (!Number.isNaN(id)) return id;
  }
  const cookieStore = await cookies();
  const value = cookieStore.get(TENANT_COOKIE)?.value;
  return value ? parseInt(value, 10) : null;
}

export function setTenantCookieInResponse(
  tenantId: number,
  maxAgeDays = 365
): string {
  const maxAge = maxAgeDays * 24 * 60 * 60;
  return `${TENANT_COOKIE}=${tenantId}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}
