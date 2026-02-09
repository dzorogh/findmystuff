-- Фильтры entity_type_id, has_items, destination_type в get_containers_with_location

drop function if exists public.get_containers_with_location(text, boolean, integer, integer, text, text);

create or replace function public.get_containers_with_location(
  search_query text default null,
  show_deleted boolean default false,
  page_limit integer default 2000,
  page_offset integer default 0,
  sort_by text default 'created_at',
  sort_direction text default 'desc',
  p_entity_type_id bigint default null,
  p_has_items boolean default null,
  p_destination_type text default null
)
returns table (
  id bigint,
  name text,
  entity_type_id bigint,
  entity_type_name text,
  created_at timestamptz,
  deleted_at timestamptz,
  photo_url text,
  destination_type text,
  destination_id bigint,
  destination_name text,
  moved_at timestamptz,
  items_count bigint,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if sort_by is null or sort_by not in ('name', 'created_at') then
    raise exception 'invalid sort_by: %. Allowed: name, created_at', coalesce(sort_by, 'NULL');
  end if;
  if sort_direction is null or sort_direction not in ('asc', 'desc') then
    raise exception 'invalid sort_direction: %. Allowed: asc, desc', coalesce(sort_direction, 'NULL');
  end if;

  return query
  with filtered_containers as (
  select
    c.id,
    c.name,
    nullif(btrim(c.name), '') as name_sort,
    c.entity_type_id,
    c.created_at,
    c.deleted_at,
    c.photo_url,
    et.name as entity_type_name
  from containers c
  left join entity_types et
    on et.id = c.entity_type_id
    and et.deleted_at is null
  where
    case
      when show_deleted then c.deleted_at is not null
      else c.deleted_at is null
    end
    and (
      search_query is null
      or search_query = ''
      or c.name ilike '%' || search_query || '%'
      or et.name ilike '%' || search_query || '%'
    )
    and (p_entity_type_id is null or c.entity_type_id = p_entity_type_id)
  ),
  with_transition as (
    select
      f.id,
      f.name,
      f.name_sort,
      f.entity_type_id,
      f.entity_type_name,
      f.created_at,
      f.deleted_at,
      f.photo_url,
      ct.destination_type,
      ct.destination_id,
      ct.created_at as moved_at
    from filtered_containers f
    left join public.mv_container_last_transition ct on ct.container_id = f.id
    where (
      p_destination_type is null
      or p_destination_type = 'all'
      or p_destination_type = ''
      or ct.destination_type = p_destination_type
    )
  ),
  items_count_all as (
    select
      t.destination_id as container_id,
      count(*)::bigint as items_count
    from public.mv_item_last_transition t
    inner join with_transition w on w.id = t.destination_id
    where t.destination_type = 'container'
    group by t.destination_id
  ),
  with_items_filter as (
    select w.*
    from with_transition w
    left join items_count_all ic on ic.container_id = w.id
    where (
      p_has_items is null
      or (p_has_items and coalesce(ic.items_count, 0) > 0)
      or (not p_has_items and coalesce(ic.items_count, 0) = 0)
    )
  ),
  paged_containers as (
    select w.*
    from with_items_filter w
    order by
      case when sort_by = 'name' and sort_direction = 'asc' then w.name_sort end asc nulls last,
      case when sort_by = 'name' and sort_direction = 'desc' then w.name_sort end desc nulls last,
      case when sort_by = 'created_at' and sort_direction = 'asc' then w.created_at end asc,
      case when sort_by = 'created_at' and sort_direction = 'desc' then w.created_at end desc,
      w.created_at desc
    offset page_offset
    limit page_limit
  ),
  container_transition as (
    select
      p.id,
      p.destination_type,
      p.destination_id,
      p.moved_at
    from paged_containers p
  ),
  items_count as (
    select
      t.destination_id as container_id,
      count(*)::bigint as items_count
    from public.mv_item_last_transition t
    inner join paged_containers pc on pc.id = t.destination_id
    where t.destination_type = 'container'
    group by t.destination_id
  )
  select
    p.id::bigint,
    p.name::text,
    p.entity_type_id::bigint,
    p.entity_type_name::text,
    p.created_at::timestamptz,
    p.deleted_at::timestamptz,
    p.photo_url::text,
    ct.destination_type::text,
    ct.destination_id::bigint,
    (
      case
        when ct.destination_type = 'room' then r.name
        when ct.destination_type = 'place' then pl.name
        when ct.destination_type = 'container' then c2.name
        else null
      end
    )::text as destination_name,
    ct.moved_at::timestamptz,
    coalesce(ic.items_count, 0)::bigint as items_count,
    (select count(*)::bigint from with_items_filter) as total_count
  from paged_containers p
  left join container_transition ct on ct.id = p.id
  left join rooms r on r.id = ct.destination_id and r.deleted_at is null and ct.destination_type = 'room'
  left join places pl on pl.id = ct.destination_id and pl.deleted_at is null and ct.destination_type = 'place'
  left join containers c2 on c2.id = ct.destination_id and c2.deleted_at is null and ct.destination_type = 'container'
  left join items_count ic on ic.container_id = p.id
  order by
    case when sort_by = 'name' and sort_direction = 'asc' then p.name_sort end asc nulls last,
    case when sort_by = 'name' and sort_direction = 'desc' then p.name_sort end desc nulls last,
    case when sort_by = 'created_at' and sort_direction = 'asc' then p.created_at end asc,
    case when sort_by = 'created_at' and sort_direction = 'desc' then p.created_at end desc,
    p.created_at desc;
end;
$$;

grant execute on function public.get_containers_with_location(text, boolean, integer, integer, text, text, bigint, boolean, text) to anon, authenticated;
