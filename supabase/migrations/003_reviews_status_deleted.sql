-- ============================================================
-- Add `deleted` status (soft delete) — run after 001 (and 002 if you use it)
-- Dashboard → SQL Editor → paste → Run
-- ============================================================
-- Status values you can set in Table Editor:
--   pending   → waiting for you
--   approved  → visible on the portfolio
--   rejected  → not shown (e.g. declined)
--   deleted   → not shown (treat as removed; row kept in DB if you prefer over hard delete)
-- ============================================================

do $$
declare
  cname text;
begin
  for cname in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'reviews'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%status%'
  loop
    execute format('alter table public.reviews drop constraint %I', cname);
  end loop;
end $$;

alter table public.reviews
  add constraint reviews_status_check
  check (status in ('pending', 'approved', 'rejected', 'deleted'));

comment on column public.reviews.status is
  'pending = new; approved = on site; rejected = hidden; deleted = soft-removed (hidden)';
