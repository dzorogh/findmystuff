-- RPC to create tenant + membership, bypasses RLS (SECURITY DEFINER)
-- Solves: API uses anon role and RLS blocks direct inserts
create or replace function public.create_tenant_for_current_user(p_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_tenant_id bigint;
  v_tenant jsonb;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  insert into public.tenants (name) values (coalesce(nullif(trim(p_name), ''), 'Мой склад'))
    returning id into v_tenant_id;
  insert into public.tenant_memberships (tenant_id, user_id, role)
    values (v_tenant_id, v_user_id, 'member');
  select jsonb_build_object('id', t.id, 'name', t.name, 'created_at', t.created_at)
    into v_tenant from public.tenants t where t.id = v_tenant_id;
  return v_tenant;
end;
$$;
