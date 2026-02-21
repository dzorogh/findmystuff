-- Auth RLS optimization: evaluate auth.uid() once per statement, not per row.
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

drop policy if exists "Users add self as first member" on public.tenant_memberships;
drop policy if exists "Users add self as first member anon" on public.tenant_memberships;

create policy "Users add self as first member" on public.tenant_memberships
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and not exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = tenant_memberships.tenant_id
    )
  );

create policy "Users add self as first member anon" on public.tenant_memberships
  for insert to anon
  with check (
    user_id = (select auth.uid())
    and (select auth.uid()) is not null
    and not exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = tenant_memberships.tenant_id
    )
  );
