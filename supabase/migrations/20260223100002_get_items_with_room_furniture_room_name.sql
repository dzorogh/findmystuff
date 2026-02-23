-- Для вещей в мебели (destination_type = furniture) заполнять room_id/room_name из furniture.room_id

create or replace function public.get_items_with_room(
  search_query text default null,
  show_deleted boolean default false,
  page_limit integer default 20,
  page_offset integer default 0,
  location_type text default null,
  room_id bigint default null,
  has_photo boolean default null,
  sort_by text default 'created_at',
  sort_direction text default 'desc',
  filter_tenant_id bigint default null,
  furniture_id bigint default null
)
returns table (
  id bigint, name text, item_type_id bigint, item_type_name text,
  created_at timestamptz, deleted_at timestamptz, photo_url text,
  price_amount bigint, price_currency text, current_value_amount bigint, current_value_currency text,
  quantity integer, purchase_date date,
  destination_type text, destination_id bigint, moved_at timestamptz,
  room_id bigint, room_name text, total_count bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
with filtered_items as (
  select i.id, i.name, nullif(btrim(i.name), '') as name_sort, i.item_type_id, i.created_at, i.deleted_at, i.photo_url,
    i.price_amount, i.price_currency, i.current_value_amount, i.current_value_currency, i.quantity, i.purchase_date, et.name as item_type_name
  from items i
  left join entity_types et on et.id = i.item_type_id and et.deleted_at is null
  where
    (filter_tenant_id is null or (filter_tenant_id = any(tenant.user_tenant_ids()) and i.tenant_id = filter_tenant_id))
    and case when show_deleted then i.deleted_at is not null else i.deleted_at is null end
    and (search_query is null or search_query = '' or i.name ilike '%' || search_query || '%' or et.name ilike '%' || search_query || '%')
    and (has_photo is null or (has_photo = true and i.photo_url is not null) or (has_photo = false and i.photo_url is null))
),
item_transition as (
  select f.id, f.name, f.name_sort, f.item_type_id, f.item_type_name, f.created_at, f.deleted_at, f.photo_url,
    f.price_amount, f.price_currency, f.current_value_amount, f.current_value_currency, f.quantity, f.purchase_date,
    it.destination_type, it.destination_id, it.created_at as moved_at
  from filtered_items f
  left join public.mv_item_last_transition it on it.item_id = f.id
),
place_room_transition as (
  select it.id, pr.room_id
  from item_transition it
  left join public.mv_place_last_room_transition pr on it.destination_type = 'place' and pr.place_id = it.destination_id
),
container_terminal as (
  select it.id, terminal.destination_type as terminal_type, terminal.destination_id as terminal_id
  from item_transition it
  left join lateral (
    with recursive chain as (
      select t.destination_type, t.destination_id, 1 as depth from public.mv_container_last_transition t where t.container_id = it.destination_id
      union all
      select t2.destination_type, t2.destination_id, c.depth + 1 from chain c
      join public.mv_container_last_transition t2 on t2.container_id = c.destination_id
      where c.destination_type = 'container' and c.depth < 10
    )
    select destination_type, destination_id from chain where destination_type is distinct from 'container' limit 1
  ) terminal on it.destination_type = 'container'
),
container_place_room_transition as (
  select ct.id, pr.room_id
  from container_terminal ct
  left join public.mv_place_last_room_transition pr on ct.terminal_type = 'place' and pr.place_id = ct.terminal_id
),
furniture_room as (
  select it.id, f.room_id
  from item_transition it
  join furniture f on f.id = it.destination_id and f.deleted_at is null
  where it.destination_type = 'furniture'
),
resolved_room as (
  select it.id, it.name, it.name_sort, it.item_type_id, it.item_type_name, it.created_at, it.deleted_at, it.photo_url,
    it.price_amount, it.price_currency, it.current_value_amount, it.current_value_currency, it.quantity, it.purchase_date,
    it.destination_type, it.destination_id, it.moved_at,
    case
      when it.destination_type = 'room' then it.destination_id
      when it.destination_type = 'place' then prt.room_id
      when it.destination_type = 'container' then case when ct.terminal_type = 'room' then ct.terminal_id when ct.terminal_type = 'place' then cprt.room_id else null end
      when it.destination_type = 'furniture' then fr.room_id
      else null
    end as room_id
  from item_transition it
  left join place_room_transition prt on prt.id = it.id
  left join container_terminal ct on ct.id = it.id
  left join container_place_room_transition cprt on cprt.id = it.id
  left join furniture_room fr on fr.id = it.id
),
filtered_with_location as (
  select rr.id, rr.name, rr.name_sort, rr.item_type_id, rr.item_type_name, rr.created_at, rr.deleted_at, rr.photo_url,
    rr.price_amount, rr.price_currency, rr.current_value_amount, rr.current_value_currency, rr.quantity, rr.purchase_date,
    rr.destination_type, rr.destination_id, rr.moved_at, rr.room_id, r.name as room_name
  from resolved_room rr
  left join rooms r on r.id = rr.room_id and r.deleted_at is null
  where (location_type is null or rr.destination_type = location_type)
    and (get_items_with_room.room_id is null or rr.room_id = get_items_with_room.room_id)
    and (get_items_with_room.furniture_id is null or (rr.destination_type = 'furniture' and rr.destination_id = get_items_with_room.furniture_id))
),
filtered_count as (select count(*)::bigint as total_count from filtered_with_location),
paged_items as (
  select * from filtered_with_location
  order by
    case when sort_by = 'name' and sort_direction = 'asc' then name_sort end asc nulls last,
    case when sort_by = 'name' and sort_direction = 'desc' then name_sort end desc nulls last,
    case when sort_by = 'created_at' and sort_direction = 'asc' then created_at end asc,
    case when sort_by = 'created_at' and sort_direction = 'desc' then created_at end desc,
    created_at desc
  offset page_offset limit page_limit
)
select p.id, p.name, p.item_type_id, p.item_type_name, p.created_at, p.deleted_at, p.photo_url,
  p.price_amount, p.price_currency, p.current_value_amount, p.current_value_currency, p.quantity, p.purchase_date,
  p.destination_type, p.destination_id, p.moved_at, p.room_id, p.room_name, fc.total_count
from paged_items p cross join filtered_count fc;
$$;
