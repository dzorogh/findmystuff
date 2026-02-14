-- Миграция: создать мебель «По умолчанию» в каждом помещении и перенести в неё все места
do $$
declare
  r record;
  default_furniture_id bigint;
begin
  for r in
    select distinct t.destination_id as room_id
    from transitions t
    where t.place_id is not null
      and t.destination_type = 'room'
      and t.destination_id is not null
  loop
    -- Найти или создать мебель «По умолчанию» в этом помещении
    select id into default_furniture_id
    from public.furniture
    where room_id = r.room_id and name = 'По умолчанию' and deleted_at is null
    limit 1;

    if default_furniture_id is null then
      insert into public.furniture (name, room_id, created_at)
      values ('По умолчанию', r.room_id, now())
      returning id into default_furniture_id;
    end if;

    if default_furniture_id is not null then
      update public.transitions
      set destination_type = 'furniture',
          destination_id = default_furniture_id
      where place_id is not null
        and destination_type = 'room'
        and destination_id = r.room_id;
    end if;
  end loop;
end $$;

-- Обновить материализованное представление
select public.refresh_items_location_materialized_views();
