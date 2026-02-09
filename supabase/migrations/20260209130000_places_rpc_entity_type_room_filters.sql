-- Фильтры по entity_type_id и room_id в get_places_with_room (на уровне БД)

drop function if exists public.get_places_with_room(text, boolean, integer, integer, text, text);

create or replace function public.get_places_with_room(
  search_query text default null,
  show_deleted boolean default false,
  page_limit integer default 100,
  page_offset integer default 0,
  sort_by text default 'created_at',
  sort_direction text default 'desc',
  filter_entity_type_id bigint default null,
  filter_room_id bigint default null
)
returns table (
  id bigint,
  name text,
  entity_type_id bigint,
  entity_type_name text,
  created_at timestamptz,
  deleted_at timestamptz,
  photo_url text,
  room_id bigint,
  room_name text,
  items_count bigint,
  containers_count bigint,
  total_count bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
with filtered_places as (
  select
    p.id,
    p.name,
    nullif(btrim(p.name), '') as name_sort,
    p.entity_type_id,
    p.created_at,
    p.deleted_at,
    p.photo_url,
    et.name as entity_type_name
  from places p
  left join entity_types et
    on et.id = p.entity_type_id
    and et.deleted_at is null
  left join public.mv_place_last_room_transition pr on pr.place_id = p.id
  where
    case
      when show_deleted then p.deleted_at is not null
      else p.deleted_at is null
    end
    and (
      search_query is null
      or search_query = ''
      or p.name ilike '%' || search_query || '%'
      or et.name ilike '%' || search_query || '%'
    )
    and (filter_entity_type_id is null or p.entity_type_id = filter_entity_type_id)
    and (filter_room_id is null or pr.room_id = filter_room_id)
),
paged_places as (
  select *
  from filtered_places
  order by
    case when sort_by = 'name' and sort_direction = 'asc' then name_sort end asc nulls last,
    case when sort_by = 'name' and sort_direction = 'desc' then name_sort end desc nulls last,
    case when sort_by = 'created_at' and sort_direction = 'asc' then created_at end asc,
    case when sort_by = 'created_at' and sort_direction = 'desc' then created_at end desc,
    created_at desc
  offset page_offset
  limit least(greatest(coalesce(nullif(page_limit, 0), 100), 1), 500)
),
items_count as (
  select
    destination_id as place_id,
    count(*)::bigint as items_count
  from public.mv_item_last_transition
  where destination_type = 'place'
  group by destination_id
),
containers_count as (
  select
    destination_id as place_id,
    count(*)::bigint as containers_count
  from public.mv_container_last_transition
  where destination_type = 'place'
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
  pr.room_id,
  r.name as room_name,
  coalesce(ic.items_count, 0) as items_count,
  coalesce(cc.containers_count, 0) as containers_count,
  (select count(*) from filtered_places) as total_count
from paged_places p
left join public.mv_place_last_room_transition pr on pr.place_id = p.id
left join rooms r on r.id = pr.room_id and r.deleted_at is null
left join items_count ic on ic.place_id = p.id
left join containers_count cc on cc.place_id = p.id
order by
  case when sort_by = 'name' and sort_direction = 'asc' then p.name_sort end asc nulls last,
  case when sort_by = 'name' and sort_direction = 'desc' then p.name_sort end desc nulls last,
  case when sort_by = 'created_at' and sort_direction = 'asc' then p.created_at end asc,
  case when sort_by = 'created_at' and sort_direction = 'desc' then p.created_at end desc,
  p.created_at desc;
$$;

grant execute on function public.get_places_with_room(text, boolean, integer, integer, text, text, bigint, bigint) to anon, authenticated;
