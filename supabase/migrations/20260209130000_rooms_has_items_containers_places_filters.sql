-- Добавление фильтров has_items, has_containers, has_places в get_rooms_with_counts

drop function if exists public.get_rooms_with_counts(text, boolean, integer, integer, text, text);

create or replace function public.get_rooms_with_counts(
  search_query text default null,
  show_deleted boolean default false,
  page_limit integer default 2000,
  page_offset integer default 0,
  sort_by text default 'created_at',
  sort_direction text default 'desc',
  has_items boolean default null,
  has_containers boolean default null,
  has_places boolean default null
)
returns table (
  id bigint,
  name text,
  room_type_id bigint,
  room_type_name text,
  created_at timestamptz,
  deleted_at timestamptz,
  photo_url text,
  items_count bigint,
  places_count bigint,
  containers_count bigint,
  total_count bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
with filtered_rooms as (
  select
    r.id,
    r.name,
    nullif(btrim(r.name), '') as name_sort,
    r.room_type_id,
    r.created_at,
    r.deleted_at,
    r.photo_url,
    et.name as room_type_name
  from rooms r
  left join entity_types et
    on et.id = r.room_type_id
    and et.deleted_at is null
  where
    case
      when show_deleted then r.deleted_at is not null
      else r.deleted_at is null
    end
    and (
      search_query is null
      or search_query = ''
      or r.name ilike '%' || search_query || '%'
      or et.name ilike '%' || search_query || '%'
    )
),
items_count as (
  select ir.room_id, count(*)::bigint as items_count
  from public.v_item_resolved_room ir
  join items i on i.id = ir.item_id and i.deleted_at is null
  group by ir.room_id
),
places_count as (
  select room_id, count(*)::bigint as places_count
  from public.mv_place_last_room_transition
  group by room_id
),
containers_count as (
  select destination_id as room_id, count(*)::bigint as containers_count
  from public.mv_container_last_transition
  where destination_type = 'room'
  group by destination_id
),
rooms_with_counts as (
  select
    p.id,
    p.name,
    p.name_sort,
    p.room_type_id,
    p.room_type_name,
    p.created_at,
    p.deleted_at,
    p.photo_url,
    coalesce(ic.items_count, 0) as items_count,
    coalesce(pc.places_count, 0) as places_count,
    coalesce(cc.containers_count, 0) as containers_count
  from filtered_rooms p
  left join items_count ic on ic.room_id = p.id
  left join places_count pc on pc.room_id = p.id
  left join containers_count cc on cc.room_id = p.id
  where
    (has_items is null or (has_items = true and coalesce(ic.items_count, 0) > 0) or (has_items = false and coalesce(ic.items_count, 0) = 0))
    and (has_containers is null or (has_containers = true and coalesce(cc.containers_count, 0) > 0) or (has_containers = false and coalesce(cc.containers_count, 0) = 0))
    and (has_places is null or (has_places = true and coalesce(pc.places_count, 0) > 0) or (has_places = false and coalesce(pc.places_count, 0) = 0))
),
total as (
  select count(*)::bigint as total_count from rooms_with_counts
),
paged_rooms as (
  select rwc.*, t.total_count
  from rooms_with_counts rwc
  cross join total t
  order by
    case when sort_by = 'name' and sort_direction = 'asc' then rwc.name_sort end asc nulls last,
    case when sort_by = 'name' and sort_direction = 'desc' then rwc.name_sort end desc nulls last,
    case when sort_by = 'created_at' and sort_direction = 'asc' then rwc.created_at end asc,
    case when sort_by = 'created_at' and sort_direction = 'desc' then rwc.created_at end desc,
    rwc.created_at desc
  offset page_offset
  limit page_limit
)
select
  p.id,
  p.name,
  p.room_type_id,
  p.room_type_name,
  p.created_at,
  p.deleted_at,
  p.photo_url,
  p.items_count,
  p.places_count,
  p.containers_count,
  p.total_count
from paged_rooms p;
$$;

grant execute on function public.get_rooms_with_counts(text, boolean, integer, integer, text, text, boolean, boolean, boolean) to anon, authenticated;
