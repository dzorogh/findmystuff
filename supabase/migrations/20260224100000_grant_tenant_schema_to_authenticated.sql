-- SECURITY INVOKER RPCs вызывают tenant.user_tenant_ids(); роли authenticated/anon должны иметь доступ к схеме tenant.

grant usage on schema tenant to authenticated, anon;
grant execute on function tenant.user_tenant_ids() to authenticated, anon;
grant execute on function tenant.is_member(bigint) to authenticated, anon;
