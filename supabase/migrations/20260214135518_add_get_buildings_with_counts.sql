-- RPC для списка зданий с счётчиками помещений
create or replace function public.get_buildings_with_counts(
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
  building_type_id bigint,
  building_type_name text,
  created_at timestamptz,
  deleted_at timestamptz,
  photo_url text,
  rooms_count bigint,
  total_count bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
with filtered_buildings as (
  select
    b.id,
    b.name,
    nullif(btrim(b.name), '') as name_sort,
    b.building_type_id,
    b.created_at,
    b.deleted_at,
    b.photo_url,
    et.name as building_type_name
  from buildings b
  left join entity_types et
    on et.id = b.building_type_id
    and et.deleted_at is null
  where
    case
      when show_deleted then b.deleted_at is not null
      else b.deleted_at is null
    end
    and (
      search_query is null
      or search_query = ''
      or b.name ilike '%' || search_query || '%'
      or et.name ilike '%' || search_query || '%'
    )
),
rooms_count as (
  select building_id, count(*)::bigint as rooms_count
  from rooms
  where building_id is not null and deleted_at is null
  group by building_id
),
buildings_with_counts as (
  select
    f.id,
    f.name,
    f.name_sort,
    f.building_type_id,
    f.building_type_name,
    f.created_at,
    f.deleted_at,
    f.photo_url,
    coalesce(rc.rooms_count, 0) as rooms_count
  from filtered_buildings f
  left join rooms_count rc on rc.building_id = f.id
),
total as (
  select count(*)::bigint as total_count from buildings_with_counts
),
paged as (
  select bwc.*, t.total_count
  from buildings_with_counts bwc
  cross join total t
  order by
    case when sort_by = 'name' and sort_direction = 'asc' then bwc.name_sort end asc nulls last,
    case when sort_by = 'name' and sort_direction = 'desc' then bwc.name_sort end desc nulls last,
    case when sort_by = 'created_at' and sort_direction = 'asc' then bwc.created_at end asc,
    case when sort_by = 'created_at' and sort_direction = 'desc' then bwc.created_at end desc,
    bwc.created_at desc
  offset page_offset
  limit page_limit
)
select
  p.id,
  p.name,
  p.building_type_id,
  p.building_type_name,
  p.created_at,
  p.deleted_at,
  p.photo_url,
  p.rooms_count,
  p.total_count
from paged p;
$$;

grant execute on function public.get_buildings_with_counts(text, boolean, integer, integer, text, text) to anon, authenticated;
