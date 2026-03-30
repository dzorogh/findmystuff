create or replace function public.enqueue_search_index_job(
  filter_tenant_id bigint,
  entity_type text,
  entity_id bigint
)
returns bigint
language plpgsql
security definer
set search_path = public, tenant, pg_temp
as $$
declare
  normalized_entity_type text := lower(btrim(coalesce(entity_type, '')));
  message_id bigint;
  request_user_id uuid := coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), '')::uuid,
    nullif((current_setting('request.jwt.claims', true)::jsonb ->> 'sub'), '')::uuid
  );
begin
  if request_user_id is null then
    raise exception 'Не удалось определить пользователя для очереди индексации';
  end if;

  if filter_tenant_id is null or filter_tenant_id <= 0 then
    raise exception 'filter_tenant_id должен быть положительным числом';
  end if;

  if not exists (
    select 1
    from public.tenant_memberships tm
    where tm.tenant_id = filter_tenant_id
      and tm.user_id = request_user_id
  ) then
    raise exception 'Нет доступа к указанному tenant';
  end if;

  if normalized_entity_type not in ('item', 'container') then
    raise exception 'Недопустимый entity_type для очереди индексации';
  end if;

  if entity_id is null or entity_id <= 0 then
    raise exception 'entity_id должен быть положительным числом';
  end if;

  select
    pgmq.send(
      queue_name => 'search_index_jobs',
      msg => jsonb_build_object(
        'tenantId', filter_tenant_id,
        'entityType', normalized_entity_type,
        'entityId', entity_id
      )
    )
  into message_id;

  return message_id;
end;
$$;

grant execute on function public.enqueue_search_index_job(bigint, text, bigint)
to authenticated, service_role;
