-- Типы (категории) помещений и вещей: колонки и обновление RPC

-- Колонка типа помещения (ссылка на entity_types с entity_category = 'room')
alter table public.rooms
  add column if not exists room_type_id bigint references public.entity_types(id);

-- Колонка типа вещи (ссылка на entity_types с entity_category = 'item')
alter table public.items
  add column if not exists item_type_id bigint references public.entity_types(id);

-- Индексы для фильтрации и джойнов
create index if not exists idx_rooms_room_type_id on public.rooms(room_type_id);
create index if not exists idx_items_item_type_id on public.items(item_type_id);

-- Удаляем старые функции (меняем возвращаемый тип)
drop function if exists public.get_rooms_with_counts(text, boolean, integer, integer);
drop function if exists public.get_items_with_room(text, boolean, integer, integer, text, bigint, boolean);

-- get_rooms_with_counts: добавить room_type_id и room_type_name
create or replace function public.get_rooms_with_counts(
  search_query text default null,
  show_deleted boolean default false,
  page_limit integer default 2000,
  page_offset integer default 0
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
paged_rooms as (
  select *
  from filtered_rooms
  order by created_at desc
  offset page_offset
  limit page_limit
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
)
select
  p.id,
  p.name,
  p.room_type_id,
  p.room_type_name,
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

-- get_items_with_room: добавить item_type_id и item_type_name
create or replace function public.get_items_with_room(
  search_query text default null,
  show_deleted boolean default false,
  page_limit integer default 20,
  page_offset integer default 0,
  location_type text default null,
  room_id bigint default null,
  has_photo boolean default null
)
returns table (
  id bigint,
  name text,
  item_type_id bigint,
  item_type_name text,
  created_at timestamptz,
  deleted_at timestamptz,
  photo_url text,
  destination_type text,
  destination_id bigint,
  moved_at timestamptz,
  room_id bigint,
  room_name text,
  total_count bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
with filtered_items as (
  select
    i.id,
    i.name,
    i.item_type_id,
    i.created_at,
    i.deleted_at,
    i.photo_url,
    et.name as item_type_name
  from items i
  left join entity_types et
    on et.id = i.item_type_id
    and et.deleted_at is null
  where
    case
      when show_deleted then i.deleted_at is not null
      else i.deleted_at is null
    end
    and (
      search_query is null
      or search_query = ''
      or i.name ilike '%' || search_query || '%'
      or et.name ilike '%' || search_query || '%'
    )
    and (
      has_photo is null
      or (has_photo = true and i.photo_url is not null)
      or (has_photo = false and i.photo_url is null)
    )
),
item_transition as (
  select
    f.id,
    f.name,
    f.item_type_id,
    f.item_type_name,
    f.created_at,
    f.deleted_at,
    f.photo_url,
    it.destination_type,
    it.destination_id,
    it.created_at as moved_at
  from filtered_items f
  left join public.mv_item_last_transition it on it.item_id = f.id
),
place_room_transition as (
  select
    it.id,
    pr.room_id
  from item_transition it
  left join public.mv_place_last_room_transition pr
    on it.destination_type = 'place'
    and pr.place_id = it.destination_id
),
container_terminal as (
  select
    it.id,
    terminal.destination_type as terminal_type,
    terminal.destination_id as terminal_id
  from item_transition it
  left join lateral (
    with recursive chain as (
      select t.destination_type, t.destination_id, 1 as depth
      from public.mv_container_last_transition t
      where t.container_id = it.destination_id
      union all
      select t2.destination_type, t2.destination_id, c.depth + 1
      from chain c
      join public.mv_container_last_transition t2
        on t2.container_id = c.destination_id
      where c.destination_type = 'container' and c.depth < 10
    )
    select destination_type, destination_id
    from chain
    where destination_type is distinct from 'container'
    limit 1
  ) terminal on it.destination_type = 'container'
),
container_place_room_transition as (
  select
    ct.id,
    pr.room_id
  from container_terminal ct
  left join public.mv_place_last_room_transition pr
    on ct.terminal_type = 'place'
    and pr.place_id = ct.terminal_id
),
resolved_room as (
  select
    it.id,
    it.name,
    it.item_type_id,
    it.item_type_name,
    it.created_at,
    it.deleted_at,
    it.photo_url,
    it.destination_type,
    it.destination_id,
    it.moved_at,
    case
      when it.destination_type = 'room' then it.destination_id
      when it.destination_type = 'place' then prt.room_id
      when it.destination_type = 'container' then
        case
          when ct.terminal_type = 'room' then ct.terminal_id
          when ct.terminal_type = 'place' then cprt.room_id
          else null
        end
      else null
    end as room_id
  from item_transition it
  left join place_room_transition prt on prt.id = it.id
  left join container_terminal ct on ct.id = it.id
  left join container_place_room_transition cprt on cprt.id = it.id
),
filtered_with_location as (
  select
    rr.id,
    rr.name,
    rr.item_type_id,
    rr.item_type_name,
    rr.created_at,
    rr.deleted_at,
    rr.photo_url,
    rr.destination_type,
    rr.destination_id,
    rr.moved_at,
    rr.room_id,
    r.name as room_name
  from resolved_room rr
  left join rooms r on r.id = rr.room_id and r.deleted_at is null
  where
    (location_type is null or rr.destination_type = location_type)
    and (room_id is null or rr.room_id = room_id)
),
paged_items as (
  select *
  from filtered_with_location
  order by created_at desc
  offset page_offset
  limit page_limit
)
select
  p.id,
  p.name,
  p.item_type_id,
  p.item_type_name,
  p.created_at,
  p.deleted_at,
  p.photo_url,
  p.destination_type,
  p.destination_id,
  p.moved_at,
  p.room_id,
  p.room_name,
  (select count(*) from filtered_with_location) as total_count
from paged_items p
order by p.created_at desc;
$$;

grant execute on function public.get_items_with_room(
  text,
  boolean,
  integer,
  integer,
  text,
  bigint,
  boolean
) to anon, authenticated;
