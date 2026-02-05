-- Добавление параметров сортировки в get_containers_with_location

drop function if exists public.get_containers_with_location(text, boolean, integer, integer);

create or replace function public.get_containers_with_location(
  search_query text default null,
  show_deleted boolean default false,
  page_limit integer default 2000,
  page_offset integer default 0,
  sort_by text default 'created_at',
  sort_direction text default 'desc'
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
language sql
stable
security definer
set search_path = public, pg_temp
as $$
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
),
paged_containers as (
  select *
  from filtered_containers
  order by
    case when sort_by = 'name' and sort_direction = 'asc' then name_sort end asc nulls last,
    case when sort_by = 'name' and sort_direction = 'desc' then name_sort end desc nulls last,
    case when sort_by = 'created_at' and sort_direction = 'asc' then created_at end asc,
    case when sort_by = 'created_at' and sort_direction = 'desc' then created_at end desc,
    created_at desc
  offset page_offset
  limit page_limit
),
container_transition as (
  select
    p.id,
    ct.destination_type,
    ct.destination_id,
    ct.created_at as moved_at
  from paged_containers p
  left join public.mv_container_last_transition ct on ct.container_id = p.id
),
items_count as (
  select
    destination_id as container_id,
    count(*)::bigint as items_count
  from public.mv_item_last_transition
  where destination_type = 'container'
  group by destination_id
)
select
  p.id,
  p.name,
  p.entity_type_id,
  p.entity_type_name,
  p.created_at,
  p.deleted_at,
  p.photo_url,
  ct.destination_type,
  ct.destination_id,
  case
    when ct.destination_type = 'room' then r.name
    when ct.destination_type = 'place' then pl.name
    when ct.destination_type = 'container' then c2.name
    else null
  end as destination_name,
  ct.moved_at,
  coalesce(ic.items_count, 0) as items_count,
  (select count(*) from filtered_containers) as total_count
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
$$;

grant execute on function public.get_containers_with_location(text, boolean, integer, integer, text, text) to anon, authenticated;
