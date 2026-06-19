-- Vedic Astro App — Supabase Schema
-- Run this in the Supabase SQL editor

-- Charts table
create table public.charts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  name        text not null,
  birth_date  text,
  birth_time  text,
  birth_location text,
  lat         numeric,
  lng         numeric,
  timezone    text,
  planets     jsonb,
  ascendant   jsonb,
  dashas      jsonb,
  ayanamsa    numeric,
  is_public   boolean default false,
  created_at  timestamptz default now()
);

-- Interpretations table
create table public.interpretations (
  id                  uuid primary key default gen_random_uuid(),
  chart_id            uuid references public.charts(id) on delete cascade,
  interpretation_type text,     -- 'quick' | 'deep' | 'timing'
  content             text,
  custom_prompt       text,
  created_at          timestamptz default now()
);

-- RLS policies
alter table public.charts enable row level security;
alter table public.interpretations enable row level security;

-- Users can only see/modify their own charts
create policy "charts: owner access"
  on public.charts
  for all
  using (auth.uid() = user_id);

-- Public charts visible to all
create policy "charts: public read"
  on public.charts
  for select
  using (is_public = true);

-- Interpretations follow chart ownership
create policy "interpretations: owner access"
  on public.interpretations
  for all
  using (
    exists (
      select 1 from public.charts
      where id = interpretations.chart_id
      and user_id = auth.uid()
    )
  );
