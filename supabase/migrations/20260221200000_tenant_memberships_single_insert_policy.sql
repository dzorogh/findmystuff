-- Single permissive INSERT policy for authenticated: merge "Members insert memberships"
-- and "Users add self as first member" to avoid evaluating two policies per insert.
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security

drop policy if exists "Members insert memberships" on public.tenant_memberships;
drop policy if exists "Users add self as first member" on public.tenant_memberships;

create policy "Members insert memberships" on public.tenant_memberships
  for insert to authenticated
  with check (
    tenant_id = any(tenant.user_tenant_ids())
    or (
      user_id = (select auth.uid())
      and not exists (
        select 1 from public.tenant_memberships tm
        where tm.tenant_id = tenant_memberships.tenant_id
      )
    )
  );
