/**
 * Tenant domain types
 */

export interface Tenant {
  id: number;
  name: string | null;
  created_at: string;
  deleted_at?: string | null;
}

export interface TenantMembership {
  id: number;
  tenant_id: number;
  user_id: string;
  role: string;
  created_at: string;
}
