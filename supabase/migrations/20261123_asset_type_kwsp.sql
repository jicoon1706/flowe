-- Desktop K · KWSP / EPF as an asset type.
--
-- Its own file: Postgres can't use a new enum value in the same transaction
-- that adds it, and 20261123b references 'kwsp'. Idempotent.

alter type public.asset_type add value if not exists 'kwsp';
