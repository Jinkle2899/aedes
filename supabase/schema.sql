-- Aedes — Supabase schema
-- Run this in your Supabase project: SQL Editor → New query → paste → Run.

-- ============ Sites ============
create table if not exists public.sites (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  kind text,
  font text,
  updated_at timestamptz not null default now(),
  blocks jsonb not null default '[]'::jsonb
);

alter table public.sites enable row level security;

create policy "Users manage their own sites"
  on public.sites
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists sites_user_updated on public.sites (user_id, updated_at desc);

-- ============ Form submissions (for the future publish flow) ============
create table if not exists public.submissions (
  id bigint generated always as identity primary key,
  site_id text not null references public.sites (id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.submissions enable row level security;

-- anyone can submit a form on a published site
create policy "Anyone can insert submissions"
  on public.submissions
  for insert
  with check (true);

-- only the site owner can read them
create policy "Owners read their submissions"
  on public.submissions
  for select
  using (exists (
    select 1 from public.sites
    where sites.id = submissions.site_id and sites.user_id = auth.uid()
  ));
