-- Добавить дефолтные entity_types для тенантов, у которых их нет
-- Данные из config/default-entity-types.json

do $$
declare
  tenant_rec record;
  defaults jsonb := '[
    {"cat":"building","names":["Дом","Квартира","Гараж","Дача","Офис","Склад"]},
    {"cat":"container","names":["Коробка","Пластик","Пакет","Сумка","Ящик","Контейнер","Другое"]},
    {"cat":"room","names":["Кухня","Ванная","Коридор","Балкон","Кладовая","Спальня","Гостиная","Детская","Кабинет"]},
    {"cat":"place","names":["Полка","Ящик","Корзина","Отсек"]},
    {"cat":"furniture","names":["Шкаф","Тумба","Стол","Стеллаж","Комод"]},
    {"cat":"item","names":["Электроника","Одежда","Книги","Документы","Инструменты"]}
  ]'::jsonb;
  item jsonb;
  name_val text;
begin
  for tenant_rec in
    select t.id from public.tenants t
    where t.deleted_at is null
    and not exists (select 1 from public.entity_types et where et.tenant_id = t.id and et.deleted_at is null)
  loop
    for item in select * from jsonb_array_elements(defaults)
    loop
      for name_val in select jsonb_array_elements_text(item->'names')
      loop
        insert into public.entity_types (tenant_id, entity_category, name)
        values (tenant_rec.id, (item->>'cat')::text, name_val);
      end loop;
    end loop;
  end loop;
end $$;
