-- Текущая оценочная стоимость (current estimated value), Fowler Money Pattern
alter table public.items
  add column if not exists current_value_amount bigint,
  add column if not exists current_value_currency char(3);

alter table public.items drop constraint if exists chk_current_value_pair;
alter table public.items
  add constraint chk_current_value_pair check (
    (current_value_amount is null and current_value_currency is null)
    or (current_value_amount is not null and current_value_currency is not null and current_value_amount >= 0)
  );

comment on column public.items.current_value_amount is 'Текущая оценочная стоимость в минимальных единицах (копейки, центы). Fowler Money Pattern.';
comment on column public.items.current_value_currency is 'Валюта текущей стоимости ISO 4217 (RUB, USD, EUR).';

-- Количество
alter table public.items
  add column if not exists quantity integer default 1;

alter table public.items drop constraint if exists chk_quantity_positive;
alter table public.items add constraint chk_quantity_positive check (quantity is null or quantity >= 1);

comment on column public.items.quantity is 'Количество единиц вещи. По умолчанию 1.';

-- Дата покупки
alter table public.items
  add column if not exists purchase_date date;

comment on column public.items.purchase_date is 'Дата покупки вещи.';
