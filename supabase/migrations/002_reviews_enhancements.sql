-- Run in Supabase SQL Editor after 001_reviews.sql (existing projects).
-- New installs: run 001 first, then this file.
--
-- If you see: "could not create unique index ... duplicated" — duplicates are removed
-- below (we keep the newest row per email). Then the index is created.

-- 0) One row per email: delete older duplicates (newest created_at wins; tie-break by id)
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY lower(trim(email))
      ORDER BY created_at DESC NULLS LAST, id DESC
    ) AS rn
  FROM public.reviews
)
DELETE FROM public.reviews AS r
USING ranked AS x
WHERE r.id = x.id
  AND x.rn > 1;

-- Unique email: one review per address
CREATE UNIQUE INDEX IF NOT EXISTS reviews_email_lower_unique
  ON public.reviews (lower(email));

-- Gravatar uses MD5(lowercase email); filled automatically by trigger (no email exposed in API select)
alter table public.reviews add column if not exists email_hash text;
alter table public.reviews add column if not exists attachment_url text;

update public.reviews
set email_hash = md5(lower(trim(email)))
where email_hash is null and email is not null;

create or replace function public.reviews_set_email_hash()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.email_hash := md5(lower(trim(new.email)));
  return new;
end;
$$;

drop trigger if exists tr_reviews_email_hash on public.reviews;
create trigger tr_reviews_email_hash
  before insert or update of email on public.reviews
  for each row
  execute procedure public.reviews_set_email_hash();

-- Screenshots (web/app preview) for each review
insert into storage.buckets (id, name, public)
values ('review-attachments', 'review-attachments', true)
on conflict (id) do nothing;

drop policy if exists "review_attachments_insert_anon" on storage.objects;
create policy "review_attachments_insert_anon"
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'review-attachments');

drop policy if exists "review_attachments_read" on storage.objects;
create policy "review_attachments_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'review-attachments');
