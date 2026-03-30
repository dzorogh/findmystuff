create extension if not exists pgmq;
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

select pgmq.create('search_index_jobs');

create or replace function public.read_vault_secret(secret_name text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  secret_value text;
begin
  if to_regclass('vault.decrypted_secrets') is null then
    return null;
  end if;

  execute
    'select decrypted_secret
       from vault.decrypted_secrets
      where name = $1
      order by updated_at desc nulls last, created_at desc
      limit 1'
  into secret_value
  using secret_name;

  return nullif(btrim(secret_value), '');
end;
$$;

create or replace function public.get_search_index_consumer_url()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  explicit_url text := public.read_vault_secret('search_index_consumer_url');
  project_url text := public.read_vault_secret('project_url');
begin
  if explicit_url is not null then
    return explicit_url;
  end if;

  if project_url is null then
    return null;
  end if;

  return rtrim(project_url, '/') || '/functions/v1/search-index-consumer';
end;
$$;

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
begin
  if filter_tenant_id is null or filter_tenant_id <= 0 then
    raise exception 'filter_tenant_id должен быть положительным числом';
  end if;

  if filter_tenant_id <> any(tenant.user_tenant_ids()) then
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

create or replace function public.read_search_index_jobs(
  batch_size integer default 20,
  visibility_timeout_seconds integer default 300
)
returns table (
  msg_id bigint,
  read_ct integer,
  enqueued_at timestamptz,
  vt timestamptz,
  message jsonb
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    q.msg_id,
    q.read_ct,
    q.enqueued_at,
    q.vt,
    q.message
  from pgmq.read(
    queue_name => 'search_index_jobs',
    vt => greatest(visibility_timeout_seconds, 1),
    qty => greatest(batch_size, 1)
  ) as q;
$$;

grant execute on function public.read_search_index_jobs(integer, integer)
to authenticated, service_role;

create or replace function public.delete_search_index_jobs(message_ids bigint[])
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  deleted_count bigint := 0;
  message_id bigint;
begin
  if coalesce(array_length(message_ids, 1), 0) = 0 then
    return 0;
  end if;

  foreach message_id in array message_ids loop
    if pgmq.delete(queue_name => 'search_index_jobs', msg_id => message_id) then
      deleted_count := deleted_count + 1;
    end if;
  end loop;

  return deleted_count;
end;
$$;

grant execute on function public.delete_search_index_jobs(bigint[])
to authenticated, service_role;

create or replace function public.invoke_search_index_consumer(
  batch_size integer default 20,
  visibility_timeout_seconds integer default 300,
  timeout_milliseconds integer default 10000
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  consumer_url text := public.get_search_index_consumer_url();
  bearer_token text := public.read_vault_secret('search_index_consumer_bearer_token');
  request_id bigint;
begin
  if consumer_url is null or bearer_token is null then
    raise log 'Search index consumer secrets are not configured in Vault';
    return null;
  end if;

  select
    net.http_post(
      url := consumer_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || bearer_token
      ),
      body := jsonb_build_object(
        'batchSize', greatest(batch_size, 1),
        'visibilityTimeoutSeconds', greatest(visibility_timeout_seconds, 1)
      ),
      timeout_milliseconds := greatest(timeout_milliseconds, 1000)
    )
  into request_id;

  return request_id;
end;
$$;

grant execute on function public.invoke_search_index_consumer(integer, integer, integer)
to service_role;

do $$
begin
  if exists (
    select 1
    from cron.job
    where jobname = 'search-index-consumer'
  ) then
    perform cron.unschedule('search-index-consumer');
  end if;

  perform cron.schedule(
    'search-index-consumer',
    '30 seconds',
    $cron$
      select public.invoke_search_index_consumer();
    $cron$
  );
end;
$$;
