-- Добавляем items_count и containers_count в get_places_with_room (как в помещениях)
create or replace function public.get_places_with_room(
  search_query text default null,
  show_deleted boolean default false,
  page_limit integer default 2000,
  page_offset integer default 0
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
    p.entity_type_id,
    p.created_at,
    p.deleted_at,
    p.photo_url,
    et.name as entity_type_name
  from places p
  left join entity_types et
    on et.id = p.entity_type_id
    and et.deleted_at is null
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
),
paged_places as (
  select *
  from filtered_places
  order by created_at desc
  offset page_offset
  limit page_limit
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
order by p.created_at desc;
$$;
