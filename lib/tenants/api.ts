/**
 * Tenant API client — getTenants, createTenant, switchTenant
 * Used by TenantProvider and tenant switcher.
 * Implemented in T011.
 */

import type { Tenant } from "./types";

export async function getTenants(): Promise<Tenant[]> {
  const res = await fetch("/api/tenants");
  if (!res.ok) throw new Error("Failed to fetch tenants");
  return res.json();
}

export async function createTenant(name: string): Promise<Tenant> {
  const res = await fetch("/api/tenants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to create tenant");
  }
  return res.json();
}

export async function switchTenant(tenantId: number): Promise<void> {
  const res = await fetch("/api/tenants/switch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenantId }),
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error("Failed to switch tenant");
}
