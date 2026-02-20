-- Allow user to add themselves as first member when creating a new tenant
-- Supabase uses role "anon" for API requests even when user is logged in
create policy "Users add self as first member anon" on public.tenant_memberships for insert to anon
  with check (
    user_id = auth.uid()
    and auth.uid() is not null
    and not exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = tenant_memberships.tenant_id
    )
  );
