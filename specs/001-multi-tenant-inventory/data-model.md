# Data Model: Multi-Tenant Home Inventory

**Feature**: 001-multi-tenant-inventory  
**Date**: 2025-02-21

## New Tables

### tenants

| Column      | Type         | Constraints                    | Notes                    |
|------------|--------------|--------------------------------|---------------------------|
| id         | bigint       | PK, generated                  |                          |
| created_at | timestamptz  | NOT NULL, default now()        |                          |
| name       | varchar(255) |                                 | Display name (e.g. "Квартира") |
| deleted_at | timestamptz  |                                 | Soft delete              |

### tenant_memberships

| Column      | Type        | Constraints                    | Notes                    |
|------------|-------------|--------------------------------|---------------------------|
| id         | bigint      | PK, generated                  |                          |
| created_at | timestamptz | NOT NULL, default now()        |                          |
| tenant_id  | bigint      | NOT NULL, FK tenants(id)       |                          |
| user_id    | uuid        | NOT NULL, FK auth.users(id)     |                          |
| role       | varchar(20) | NOT NULL, default 'member'     | Use 'member' only; spec: no role distinction |
| UNIQUE     | (tenant_id, user_id) |                           | One membership per user per tenant |

### tenant_invitations

| Column       | Type        | Constraints                     | Notes                    |
|--------------|-------------|---------------------------------|---------------------------|
| id           | bigint      | PK, generated                   |                          |
| created_at   | timestamptz | NOT NULL, default now()         |                          |
| tenant_id    | bigint      | NOT NULL, FK tenants(id)        |                          |
| inviter_id   | uuid        | NOT NULL, FK auth.users(id)     |                          |
| invitee_email| varchar(255)|                                 | Nullable for shareable link (open invite); set when known |
| status       | varchar(20) | NOT NULL, default 'pending'     | pending \| accepted \| declined \| expired |
| token        | varchar(64) | UNIQUE, NOT NULL               | For accept link           |
| expires_at   | timestamptz | NOT NULL                        | Default now() + 7 days    |

## Modified Tables (add tenant_id)

Добавить `tenant_id bigint NOT NULL REFERENCES tenants(id)` в:

- buildings
- rooms (tenant_id NOT NULL; building belongs to tenant via building.tenant_id)
- furniture
- places
- containers
- items
- transitions (или выводить tenant через item/container)

Для transitions: item_id и container_id уже привязаны к tenant-scoped сущностям. Рекомендация: добавить tenant_id в transitions для упрощения RLS и производительности (индекс).

## Helper Functions (Supabase)

### tenant.user_tenant_ids()

```sql
-- Returns array of tenant_ids the current user is a member of
create or replace function tenant.user_tenant_ids()
returns bigint[] language sql stable security definer
set search_path = public
as $$
  select coalesce(array_agg(tenant_id), '{}')::bigint[]
  from tenant_memberships
  where user_id = auth.uid();
$$;
```

### tenant.is_member(tenant_id bigint)

```sql
-- Returns true if current user is member of given tenant
create or replace function tenant.is_member(p_tenant_id bigint)
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from tenant_memberships
    where tenant_id = p_tenant_id and user_id = auth.uid()
  );
$$;
```

## RLS Policy Pattern

Для каждой tenant-scoped таблицы:

```sql
-- SELECT
create policy "Users see only their tenant data"
  on public.rooms for select to authenticated
  using (tenant_id = ANY((select tenant.user_tenant_ids())));

-- INSERT
create policy "Users insert only into their tenant"
  on public.rooms for insert to authenticated
  with check (tenant_id = ANY((select tenant.user_tenant_ids())));

-- UPDATE, DELETE: аналогично с using
```

Удалить существующие политики `using (true)` и заменить на tenant-scoped.

## Indexes

- `idx_tenant_memberships_user_id` on tenant_memberships(user_id)
- `idx_tenant_memberships_tenant_id` on tenant_memberships(tenant_id)
- `idx_tenant_invitations_token` on tenant_invitations(token)
- `idx_tenant_invitations_tenant_id` on tenant_invitations(tenant_id)
- `idx_rooms_tenant_id`, `idx_items_tenant_id`, и т.д. на всех tenant-scoped таблицах

## State Transitions

### tenant_invitations.status

- pending → accepted (user accepts)
- pending → declined (user declines)
- pending → expired (expires_at < now())
