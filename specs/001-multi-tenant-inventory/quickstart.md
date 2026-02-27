# Quickstart: Multi-Tenant Home Inventory

**Feature**: 001-multi-tenant-inventory

## Prerequisites

- Node 20+, npm
- Supabase project with migrations applied
- Google OAuth configured (Supabase Auth)

## Setup

1. **Apply migrations**

```bash
supabase db push
# or: supabase migration up
```

2. **Migrate existing data** (if any)

Migration script assigns default tenant to existing users and sets `tenant_id` on all rows. Run as part of deployment.

3. **Environment**

No new env vars. Existing Supabase keys suffice.

## Development Flow

1. **Login** → User lands on app. If no tenants → redirect to onboarding.
2. **Onboarding** → Create tenant "Мой склад" or accept invitation.
3. **App** → Tenant context set. All lists/filters scoped to active tenant.
4. **Tenant switch** → Use tenant switcher in header/sidebar; cookie updated.

## Key Files to Create/Modify

| Path | Action |
|------|--------|
| `supabase/migrations/YYYYMMDD_multi_tenancy.sql` | New: tenants, memberships, invitations, tenant_id columns, RLS |
| `contexts/tenant-context.tsx` | New: TenantProvider, useTenant |
| `components/tenant-switcher/` | New: Dropdown to select tenant |
| `components/tenant-onboarding/` | New: Create/join tenant UI |
| `lib/shared/api/client.ts` | Modify: add tenantId to all requests |
| `app/api/**/route.ts` | Modify: read X-Tenant-Id, pass to Supabase |
| `app/(app)/layout.tsx` | Modify: wrap with TenantProvider |

## Verification

1. Create two tenants with different users
2. Add items in each
3. Login as user A → see only tenant A data
4. Login as user B → see only tenant B data
5. Add user B to tenant A via invitation → user B can switch and see both
