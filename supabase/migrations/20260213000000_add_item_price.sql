-- Fowler Money Pattern: amount в минимальных единицах + код валюты ISO 4217

alter table public.items
  add column if not exists price_amount bigint,
  add column if not exists price_currency char(3);

alter table public.items drop constraint if exists chk_price_pair;
alter table public.items
  add constraint chk_price_pair check (
    (price_amount is null and price_currency is null)
    or (price_amount is not null and price_currency is not null and price_amount >= 0)
  );

comment on column public.items.price_amount is 'Сумма в минимальных единицах (копейки, центы). Fowler Money Pattern.';
comment on column public.items.price_currency is 'Код валюты ISO 4217 (RUB, USD, EUR). Fowler Money Pattern.';
