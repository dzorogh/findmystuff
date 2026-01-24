create or replace function public.get_containers_with_location(
  search_query text default null,
  show_deleted boolean default false,
  page_limit integer default 2000,
  page_offset integer default 0
)
returns table (
  id bigint,
  name text,
  entity_type_id bigint,
  entity_type_code text,
  entity_type_name text,
  marking_number integer,
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
    c.entity_type_id,
    c.marking_number,
    c.created_at,
    c.deleted_at,
    c.photo_url,
    et.code as entity_type_code,
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
      or (search_query ~ '^[0-9]+$' and c.marking_number = search_query::int)
      or et.code ilike '%' || search_query || '%'
      or et.name ilike '%' || search_query || '%'
    )
),
paged_containers as (
  select *
  from filtered_containers
  order by created_at desc
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
  p.entity_type_code,
  p.entity_type_name,
  p.marking_number,
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
order by p.created_at desc;
$$;

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
  entity_type_code text,
  entity_type_name text,
  marking_number integer,
  created_at timestamptz,
  deleted_at timestamptz,
  photo_url text,
  room_id bigint,
  room_name text,
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
    p.marking_number,
    p.created_at,
    p.deleted_at,
    p.photo_url,
    et.code as entity_type_code,
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
      or (search_query ~ '^[0-9]+$' and p.marking_number = search_query::int)
      or et.code ilike '%' || search_query || '%'
      or et.name ilike '%' || search_query || '%'
    )
),
paged_places as (
  select *
  from filtered_places
  order by created_at desc
  offset page_offset
  limit page_limit
)
select
  p.id,
  p.name,
  p.entity_type_id,
  p.entity_type_code,
  p.entity_type_name,
  p.marking_number,
  p.created_at,
  p.deleted_at,
  p.photo_url,
  pr.room_id,
  r.name as room_name,
  (select count(*) from filtered_places) as total_count
from paged_places p
left join public.mv_place_last_room_transition pr on pr.place_id = p.id
left join rooms r on r.id = pr.room_id and r.deleted_at is null
order by p.created_at desc;
$$;

create or replace function public.get_rooms_with_counts(
  search_query text default null,
  show_deleted boolean default false,
  page_limit integer default 2000,
  page_offset integer default 0
)
returns table (
  id bigint,
  name text,
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
    r.created_at,
    r.deleted_at,
    r.photo_url
  from rooms r
  where
    case
      when show_deleted then r.deleted_at is not null
      else r.deleted_at is null
    end
    and (
      search_query is null
      or search_query = ''
      or r.name ilike '%' || search_query || '%'
    )
),
paged_rooms as (
  select *
  from filtered_rooms
  order by created_at desc
  offset page_offset
  limit page_limit
),
items_count as (
  select destination_id as room_id, count(*)::bigint as items_count
  from public.mv_item_last_transition
  where destination_type = 'room'
  group by destination_id
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
)
select
  p.id,
  p.name,
  p.created_at,
  p.deleted_at,
  p.photo_url,
  coalesce(ic.items_count, 0) as items_count,
  coalesce(pc.places_count, 0) as places_count,
  coalesce(cc.containers_count, 0) as containers_count,
  (select count(*) from filtered_rooms) as total_count
from paged_rooms p
left join items_count ic on ic.room_id = p.id
left join places_count pc on pc.room_id = p.id
left join containers_count cc on cc.room_id = p.id
order by p.created_at desc;
$$;

grant execute on function public.get_containers_with_location(
  text,
  boolean,
  integer,
  integer
) to anon, authenticated;

grant execute on function public.get_places_with_room(
  text,
  boolean,
  integer,
  integer
) to anon, authenticated;

grant execute on function public.get_rooms_with_counts(
  text,
  boolean,
  integer,
  integer
) to anon, authenticated;
