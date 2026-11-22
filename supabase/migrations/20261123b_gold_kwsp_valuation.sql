-- Desktop K · Gold valuation (grams × PG Buy price) and KWSP / EPF balances.
--
-- Gold reuses assets.quantity (grams, numeric(16,4)) and unit ('g') from
-- 20260830b. New: purity, PG Buy price per gram, price date, optional cost.
-- KWSP keeps its three balances on the row; current_value is their sum.
--
-- Additive: existing rows are untouched. A gold row with no price keeps the
-- value it has; it becomes "priced" the first time it is saved in the Gold
-- form. Nothing here rewrites asset_values.
--
-- Idempotent (`if not exists`, drop-then-add constraints, `create or replace`).
-- Every function is `security invoker`, so the existing assets / asset_values
-- RLS policies (auth.uid() = user_id) decide what each caller can touch.

-- ─── 1. Columns ─────────────────────────────────────────────────────────────

alter table public.assets
  add column if not exists purity          smallint,
  add column if not exists price_per_gram  numeric(12,2),
  add column if not exists price_date      date,
  add column if not exists cost            numeric(12,2),
  add column if not exists kwsp_persaraan  numeric(12,2),
  add column if not exists kwsp_sejahtera  numeric(12,2),
  add column if not exists kwsp_fleksibel  numeric(12,2);

comment on column public.assets.purity is 'Gold only: 999 or 916.';
comment on column public.assets.price_per_gram is 'Gold only: Public Gold buy-back (PG Buy) price per gram, RM.';
comment on column public.assets.price_date is 'Gold only: date the price was saved (Asia/Kuala_Lumpur). Stale after 30 days.';
comment on column public.assets.cost is 'Gold only, optional: what was paid. Gain/loss = current_value − cost.';
comment on column public.assets.kwsp_persaraan is 'KWSP only: Akaun Persaraan balance.';
comment on column public.assets.kwsp_sejahtera is 'KWSP only: Akaun Sejahtera balance.';
comment on column public.assets.kwsp_fleksibel is 'KWSP only: Akaun Fleksibel balance.';

-- ─── 2. Constraints ─────────────────────────────────────────────────────────

alter table public.assets drop constraint if exists assets_purity_check;
alter table public.assets add  constraint assets_purity_check
  check (purity is null or purity in (999, 916));

alter table public.assets drop constraint if exists assets_price_per_gram_check;
alter table public.assets add  constraint assets_price_per_gram_check
  check (price_per_gram is null or price_per_gram > 0);

alter table public.assets drop constraint if exists assets_cost_check;
alter table public.assets add  constraint assets_cost_check
  check (cost is null or cost >= 0);

alter table public.assets drop constraint if exists assets_kwsp_nonneg_check;
alter table public.assets add  constraint assets_kwsp_nonneg_check
  check (coalesce(kwsp_persaraan, 0) >= 0 and coalesce(kwsp_sejahtera, 0) >= 0 and coalesce(kwsp_fleksibel, 0) >= 0);

-- Gold fields only on gold, KWSP fields only on KWSP.
alter table public.assets drop constraint if exists assets_gold_fields_check;
alter table public.assets add  constraint assets_gold_fields_check
  check (type = 'gold' or (purity is null and price_per_gram is null and price_date is null and cost is null));

alter table public.assets drop constraint if exists assets_kwsp_fields_check;
alter table public.assets add  constraint assets_kwsp_fields_check
  check (type = 'kwsp' or (kwsp_persaraan is null and kwsp_sejahtera is null and kwsp_fleksibel is null));

-- ─── 3. One place that keeps the stored value equal to the formula ─────────
--
-- Runs before every insert/update, whatever the write path (form, RPC,
-- import, adjust_asset_value), so current_value can't drift from
-- grams × price or from the KWSP sum.

create or replace function public.assets_derive_value()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.type = 'gold' and new.price_per_gram is not null then
    if new.quantity is null or new.quantity <= 0 then
      raise exception 'Gold needs grams held above 0' using errcode = '23514';
    end if;
    new.purity        := coalesce(new.purity, 999);
    new.unit          := 'g';
    new.current_value := round(new.quantity * new.price_per_gram, 2);
    -- Stamped on insert and whenever the price changes, unless the writer set
    -- it (save_gold_asset always stamps the save date).
    if tg_op = 'INSERT' and new.price_date is null then
      new.price_date := (now() at time zone 'Asia/Kuala_Lumpur')::date;
    elsif tg_op = 'UPDATE' and new.price_per_gram is distinct from old.price_per_gram
          and new.price_date is not distinct from old.price_date then
      new.price_date := (now() at time zone 'Asia/Kuala_Lumpur')::date;
    end if;
  elsif new.type = 'kwsp' then
    new.kwsp_persaraan := coalesce(new.kwsp_persaraan, 0);
    new.kwsp_sejahtera := coalesce(new.kwsp_sejahtera, 0);
    new.kwsp_fleksibel := coalesce(new.kwsp_fleksibel, 0);
    new.current_value  := new.kwsp_persaraan + new.kwsp_sejahtera + new.kwsp_fleksibel;
    new.monthly_income := 0;              -- no monthly income field for KWSP
    new.name           := 'KWSP / EPF';   -- the name is fixed (dn-kwsp-filled)
    new.quantity       := null;
    new.unit           := null;
  end if;
  return new;
end;
$$;

drop trigger if exists assets_derive_value on public.assets;
create trigger assets_derive_value
  before insert or update on public.assets
  for each row execute function public.assets_derive_value();

-- ─── 4. Save a Gold asset ───────────────────────────────────────────────────
--
-- Creates (p_id null) or updates the asset and records this month's value in
-- asset_values, in one transaction. price_date = the save date.

create or replace function public.save_gold_asset(
  p_id             uuid,
  p_name           text,
  p_grams          numeric,
  p_purity         smallint,
  p_price_per_gram numeric,
  p_cost           numeric
)
returns public.assets
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Asia/Kuala_Lumpur')::date;
  v_row   assets;
begin
  if auth.uid() is null then
    raise exception 'save_gold_asset: not signed in' using errcode = '42501';
  end if;
  if p_name is null or btrim(p_name) = '' then
    raise exception 'Give the asset a name' using errcode = '23514';
  end if;

  if p_id is null then
    insert into assets (user_id, name, type, icon, current_value, quantity, unit,
                        purity, price_per_gram, price_date, cost)
    values (auth.uid(), btrim(p_name), 'gold', 'gold', 0, p_grams, 'g',
            coalesce(p_purity, 999), p_price_per_gram, v_today, p_cost)
    returning * into v_row;
  else
    update assets
       set name = btrim(p_name), quantity = p_grams, purity = coalesce(p_purity, 999),
           price_per_gram = p_price_per_gram, price_date = v_today, cost = p_cost,
           updated_at = now()
     where id = p_id and type = 'gold'
    returning * into v_row;
    if v_row.id is null then
      raise exception 'save_gold_asset: asset not found' using errcode = 'P0002';
    end if;
  end if;

  insert into asset_values (asset_id, user_id, month, value, quantity)
  values (v_row.id, v_row.user_id, date_trunc('month', v_today)::date, v_row.current_value, v_row.quantity)
  on conflict (asset_id, month)
  do update set value = excluded.value, quantity = excluded.quantity, updated_at = now();

  return v_row;
end;
$$;

-- ─── 5. Save a KWSP / EPF asset ─────────────────────────────────────────────

create or replace function public.save_kwsp_asset(
  p_id        uuid,
  p_persaraan numeric,
  p_sejahtera numeric,
  p_fleksibel numeric
)
returns public.assets
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Asia/Kuala_Lumpur')::date;
  v_row   assets;
begin
  if auth.uid() is null then
    raise exception 'save_kwsp_asset: not signed in' using errcode = '42501';
  end if;
  if coalesce(p_persaraan, 0) + coalesce(p_sejahtera, 0) + coalesce(p_fleksibel, 0) <= 0 then
    raise exception 'Enter at least one KWSP balance' using errcode = '23514';
  end if;

  if p_id is null then
    insert into assets (user_id, name, type, icon, current_value, kwsp_persaraan, kwsp_sejahtera, kwsp_fleksibel)
    values (auth.uid(), 'KWSP / EPF', 'kwsp', 'kwsp', 0, p_persaraan, p_sejahtera, p_fleksibel)
    returning * into v_row;
  else
    update assets
       set kwsp_persaraan = p_persaraan, kwsp_sejahtera = p_sejahtera, kwsp_fleksibel = p_fleksibel,
           updated_at = now()
     where id = p_id and type = 'kwsp'
    returning * into v_row;
    if v_row.id is null then
      raise exception 'save_kwsp_asset: asset not found' using errcode = 'P0002';
    end if;
  end if;

  insert into asset_values (asset_id, user_id, month, value)
  values (v_row.id, v_row.user_id, date_trunc('month', v_today)::date, v_row.current_value)
  on conflict (asset_id, month)
  do update set value = excluded.value, updated_at = now();

  return v_row;
end;
$$;

-- Extension point (phase 2, NOT built): monthly KWSP contributions (majikan /
-- ahli). They will live in their own table keyed by asset_id + month and feed
-- asset_values. No table is created now. TS type: KwspContribution.

-- ─── 6. Investing into a priced Gold asset (Phase 0, Q3) ────────────────────
--
-- A priced gold asset's value is grams × price, so an investment transfer
-- can't move it any more (the trigger would undo it). Its ringgit goes into
-- `cost` instead; the user updates grams in the Gold drawer. Every other
-- asset, and unpriced gold, behaves exactly as before (20261116_audit_sql.sql).

create or replace function public.adjust_asset_value(
  p_asset_id uuid,
  p_delta    numeric,
  p_month    date
)
returns numeric
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_value numeric;
  v_user  uuid;
  v_qty   numeric;
begin
  if p_asset_id is null then
    return null;
  end if;

  if p_delta is null or p_delta = 0 then
    select current_value into v_value from assets where id = p_asset_id;
    return v_value;
  end if;

  update assets
     set current_value = case when type = 'gold' and price_per_gram is not null
                              then current_value
                              else greatest(0, current_value + p_delta) end,
         cost          = case when type = 'gold' and price_per_gram is not null
                              then greatest(0, coalesce(cost, 0) + p_delta)
                              else cost end,
         updated_at    = now()
   where id = p_asset_id
  returning current_value, user_id, quantity into v_value, v_user, v_qty;

  -- Not ours (RLS hid it) or gone: nothing moved.
  if v_user is null then
    return null;
  end if;

  insert into asset_values (asset_id, user_id, month, value, quantity)
  values (p_asset_id, v_user, date_trunc('month', coalesce(p_month, current_date))::date, v_value, v_qty)
  on conflict (asset_id, month)
  do update set value = excluded.value, quantity = excluded.quantity, updated_at = now();

  return v_value;
end;
$$;

-- ─── 7. Grants ──────────────────────────────────────────────────────────────

revoke all on function public.assets_derive_value() from public, anon, authenticated;
revoke all on function public.save_gold_asset(uuid, text, numeric, smallint, numeric, numeric) from public, anon;
revoke all on function public.save_kwsp_asset(uuid, numeric, numeric, numeric) from public, anon;
grant execute on function public.save_gold_asset(uuid, text, numeric, smallint, numeric, numeric) to authenticated;
grant execute on function public.save_kwsp_asset(uuid, numeric, numeric, numeric) to authenticated;
grant execute on function public.adjust_asset_value(uuid, numeric, date) to authenticated, anon;
