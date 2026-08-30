-- Assets held as a physical quantity, not just a ringgit value.
--
-- Gold is the case that forced this: a purchase is made in ringgit ("RM 100 of
-- gold", the usual minimum) but what the owner actually holds is a weight, and
-- the two move together at whatever the day's rate happens to be. Storing only
-- the ringgit value loses the weight; storing only the weight loses what was
-- paid. So both are kept, and a top-up adds to each.
--
-- Null for every other asset type, which has no meaningful unit — a house is
-- not measured in anything the balance sheet cares about.

alter table public.assets
  -- 4 decimal places: gold is bought in fractions of a gram at RM100 a time.
  add column if not exists quantity numeric(16, 4),
  -- Free text rather than an enum so a future asset type (ounces, shares, lots)
  -- doesn't need a migration to be recorded.
  add column if not exists unit varchar(12);

comment on column public.assets.quantity is
  'Physical amount held (e.g. grams of gold). Null when the asset has no unit.';
comment on column public.assets.unit is
  'Unit for `quantity`, e.g. ''g''. Null when the asset has no unit.';
