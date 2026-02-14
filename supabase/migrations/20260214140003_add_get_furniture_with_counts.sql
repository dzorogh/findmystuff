-- RPC для списка мебели с счётчиками мест
create or replace function public.get_furniture_with_counts(
  search_query text default null,
  show_deleted boolean default false,
  page_limit integer default 2000,
  page_offset integer default 0,
  sort_by text default 'created_at',
  sort_direction text default 'desc',
  filter_room_id bigint default null
)
returns table (
  id bigint,
  name text,
  room_id bigint,
  room_name text,
  furniture_type_id bigint,
  furniture_type_name text,
  created_at timestamptz,
  deleted_at timestamptz,
  photo_url text,
  places_count bigint,
  total_count bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
with filtered_furniture as (
  select
    f.id,
    f.name,
    nullif(btrim(f.name), '') as name_sort,
    f.room_id,
    f.furniture_type_id,
    f.created_at,
    f.deleted_at,
    f.photo_url,
    r.name as room_name,
    et.name as furniture_type_name
  from furniture f
  left join rooms r on r.id = f.room_id and r.deleted_at is null
  left join entity_types et on et.id = f.furniture_type_id and et.deleted_at is null
  where
    case
      when show_deleted then f.deleted_at is not null
      else f.deleted_at is null
    end
    and (filter_room_id is null or f.room_id = filter_room_id)
    and (
      search_query is null
      or search_query = ''
      or f.name ilike '%' || search_query || '%'
      or et.name ilike '%' || search_query || '%'
    )
),
places_count as (
  select destination_id as furniture_id, count(*)::bigint as places_count
  from transitions t
  where t.place_id is not null and t.destination_type = 'furniture'
  group by destination_id
),
furniture_with_counts as (
  select
    f.id,
    f.name,
    f.name_sort,
    f.room_id,
    f.room_name,
    f.furniture_type_id,
    f.furniture_type_name,
    f.created_at,
    f.deleted_at,
    f.photo_url,
    coalesce(pc.places_count, 0) as places_count
  from filtered_furniture f
  left join places_count pc on pc.furniture_id = f.id
),
total as (
  select count(*)::bigint as total_count from furniture_with_counts
),
paged as (
  select fwc.*, t.total_count
  from furniture_with_counts fwc
  cross join total t
  order by
    case when sort_by = 'name' and sort_direction = 'asc' then fwc.name_sort end asc nulls last,
    case when sort_by = 'name' and sort_direction = 'desc' then fwc.name_sort end desc nulls last,
    case when sort_by = 'created_at' and sort_direction = 'asc' then fwc.created_at end asc,
    case when sort_by = 'created_at' and sort_direction = 'desc' then fwc.created_at end desc,
    fwc.created_at desc
  offset page_offset
  limit page_limit
)
select
  p.id,
  p.name,
  p.room_id,
  p.room_name,
  p.furniture_type_id,
  p.furniture_type_name,
  p.created_at,
  p.deleted_at,
  p.photo_url,
  p.places_count,
  p.total_count
from paged p;
$$;

grant execute on function public.get_furniture_with_counts(text, boolean, integer, integer, text, text, bigint) to anon, authenticated;
