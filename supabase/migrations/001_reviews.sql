-- ============================================================
-- PORTFOLIO REVIEWS — run in Supabase
-- Dashboard → SQL Editor → New query → paste ALL of this → Run
-- ============================================================
-- After this runs: Table Editor → reviews → set status = approved
-- to show a review on your site. Pending = hidden from visitors.
-- ============================================================

-- 1) Reviews table
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  profile_image_url text,
  rating int not null check (rating >= 1 and rating <= 5),
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected'))
);

alter table public.reviews enable row level security;

-- 2) Visitors may INSERT only when status is pending
drop policy if exists "reviews_insert_pending_only" on public.reviews;
create policy "reviews_insert_pending_only"
  on public.reviews
  for insert
  to anon
  with check (status = 'pending');

-- 3) Visitors may SELECT only approved rows
drop policy if exists "reviews_select_approved" on public.reviews;
create policy "reviews_select_approved"
  on public.reviews
  for select
  to anon
  using (status = 'approved');

-- 4) Storage bucket for profile photos (public URLs)
insert into storage.buckets (id, name, public)
values ('review-avatars', 'review-avatars', true)
on conflict (id) do nothing;

drop policy if exists "review_avatars_insert_anon" on storage.objects;
create policy "review_avatars_insert_anon"
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'review-avatars');

drop policy if exists "review_avatars_read" on storage.objects;
create policy "review_avatars_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'review-avatars');
