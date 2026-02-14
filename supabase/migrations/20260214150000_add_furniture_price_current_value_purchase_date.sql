-- Стоимость покупки
alter table public.furniture
  add column if not exists price_amount bigint,
  add column if not exists price_currency char(3);

alter table public.furniture drop constraint if exists chk_furniture_price_pair;
alter table public.furniture
  add constraint chk_furniture_price_pair check (
    (price_amount is null and price_currency is null)
    or (price_amount is not null and price_currency is not null and price_amount >= 0)
  );

comment on column public.furniture.price_amount is 'Стоимость покупки в минимальных единицах (копейки, центы). Fowler Money Pattern.';
comment on column public.furniture.price_currency is 'Валюта стоимости покупки ISO 4217 (RUB, USD, EUR).';

-- Текущая оценочная стоимость
alter table public.furniture
  add column if not exists current_value_amount bigint,
  add column if not exists current_value_currency char(3);

alter table public.furniture drop constraint if exists chk_furniture_current_value_pair;
alter table public.furniture
  add constraint chk_furniture_current_value_pair check (
    (current_value_amount is null and current_value_currency is null)
    or (current_value_amount is not null and current_value_currency is not null and current_value_amount >= 0)
  );

comment on column public.furniture.current_value_amount is 'Текущая оценочная стоимость в минимальных единицах (копейки, центы). Fowler Money Pattern.';
comment on column public.furniture.current_value_currency is 'Валюта текущей стоимости ISO 4217 (RUB, USD, EUR).';

-- Дата покупки
alter table public.furniture
  add column if not exists purchase_date date;

comment on column public.furniture.purchase_date is 'Дата покупки мебели.';
