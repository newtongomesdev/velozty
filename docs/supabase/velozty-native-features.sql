create extension if not exists pgcrypto;

create table if not exists public.user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  metric text not null check (metric in ('distance', 'races', 'wins')),
  target_value numeric(12,2) not null check (target_value > 0),
  timeframe text not null check (timeframe in ('week', 'month', 'all')),
  modality text not null check (modality in ('running', 'bike', 'other', 'all')),
  created_at timestamptz not null default now()
);

create index if not exists user_goals_user_created_idx
  on public.user_goals (user_id, created_at desc);

alter table public.user_goals enable row level security;

drop policy if exists user_goals_select on public.user_goals;
create policy user_goals_select on public.user_goals
for select using (user_id = auth.uid() or private.is_admin_user());

drop policy if exists user_goals_insert on public.user_goals;
create policy user_goals_insert on public.user_goals
for insert with check (user_id = auth.uid() or private.is_admin_user());

drop policy if exists user_goals_update on public.user_goals;
create policy user_goals_update on public.user_goals
for update using (user_id = auth.uid() or private.is_admin_user())
with check (user_id = auth.uid() or private.is_admin_user());

drop policy if exists user_goals_delete on public.user_goals;
create policy user_goals_delete on public.user_goals
for delete using (user_id = auth.uid() or private.is_admin_user());

create table if not exists public.user_challenges (
  id uuid primary key default gen_random_uuid(),
  creator_user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  metric text not null check (metric in ('distance', 'races', 'wins', 'top_speed')),
  target_value numeric(12,2) not null check (target_value > 0),
  timeframe text not null check (timeframe in ('week', 'month')),
  modality text not null check (modality in ('running', 'bike', 'other', 'all')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists user_challenges_created_idx
  on public.user_challenges (created_at desc);

create index if not exists user_challenges_creator_idx
  on public.user_challenges (creator_user_id, created_at desc);

alter table public.user_challenges enable row level security;

drop policy if exists user_challenges_select on public.user_challenges;
create policy user_challenges_select on public.user_challenges
for select using (
  creator_user_id = auth.uid()
  or private.is_admin_user()
  or exists (
    select 1
    from public.social_follows follow
    where (
      (follow.follower_id = auth.uid() and follow.following_id = user_challenges.creator_user_id)
      or (follow.following_id = auth.uid() and follow.follower_id = user_challenges.creator_user_id)
    )
  )
);

drop policy if exists user_challenges_insert on public.user_challenges;
create policy user_challenges_insert on public.user_challenges
for insert with check (creator_user_id = auth.uid() or private.is_admin_user());

drop policy if exists user_challenges_update on public.user_challenges;
create policy user_challenges_update on public.user_challenges
for update using (creator_user_id = auth.uid() or private.is_admin_user())
with check (creator_user_id = auth.uid() or private.is_admin_user());

drop policy if exists user_challenges_delete on public.user_challenges;
create policy user_challenges_delete on public.user_challenges
for delete using (creator_user_id = auth.uid() or private.is_admin_user());

create table if not exists public.challenge_entries (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.user_challenges(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (challenge_id, user_id)
);

create index if not exists challenge_entries_challenge_idx
  on public.challenge_entries (challenge_id, created_at desc);

create index if not exists challenge_entries_user_idx
  on public.challenge_entries (user_id, created_at desc);

alter table public.challenge_entries enable row level security;

drop policy if exists challenge_entries_select on public.challenge_entries;
create policy challenge_entries_select on public.challenge_entries
for select using (
  user_id = auth.uid()
  or private.is_admin_user()
  or exists (
    select 1
    from public.user_challenges challenge
    where challenge.id = challenge_entries.challenge_id
      and (
        challenge.creator_user_id = auth.uid()
        or exists (
          select 1
          from public.social_follows follow
          where (
            (follow.follower_id = auth.uid() and follow.following_id = challenge.creator_user_id)
            or (follow.following_id = auth.uid() and follow.follower_id = challenge.creator_user_id)
          )
        )
      )
  )
);

drop policy if exists challenge_entries_insert on public.challenge_entries;
create policy challenge_entries_insert on public.challenge_entries
for insert with check (user_id = auth.uid() or private.is_admin_user());

drop policy if exists challenge_entries_delete on public.challenge_entries;
create policy challenge_entries_delete on public.challenge_entries
for delete using (
  user_id = auth.uid()
  or private.is_admin_user()
  or exists (
    select 1
    from public.user_challenges challenge
    where challenge.id = challenge_entries.challenge_id
      and challenge.creator_user_id = auth.uid()
  )
);

create table if not exists public.performance_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  snapshot_date date not null,
  timeframe text not null check (timeframe in ('day', 'week', 'month', 'all')),
  modality text not null check (modality in ('running', 'bike', 'other', 'all')),
  total_distance_m numeric(12,2) not null default 0,
  total_races integer not null default 0,
  total_wins integer not null default 0,
  top_speed_kmh numeric(10,2) not null default 0,
  active_days integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, snapshot_date, timeframe, modality)
);

create index if not exists performance_snapshots_user_date_idx
  on public.performance_snapshots (user_id, snapshot_date desc);

alter table public.performance_snapshots enable row level security;

drop policy if exists performance_snapshots_select on public.performance_snapshots;
create policy performance_snapshots_select on public.performance_snapshots
for select using (user_id = auth.uid() or private.is_admin_user());

drop policy if exists performance_snapshots_insert on public.performance_snapshots;
create policy performance_snapshots_insert on public.performance_snapshots
for insert with check (user_id = auth.uid() or private.is_admin_user());

drop policy if exists performance_snapshots_update on public.performance_snapshots;
create policy performance_snapshots_update on public.performance_snapshots
for update using (user_id = auth.uid() or private.is_admin_user())
with check (user_id = auth.uid() or private.is_admin_user());

drop policy if exists performance_snapshots_delete on public.performance_snapshots;
create policy performance_snapshots_delete on public.performance_snapshots
for delete using (user_id = auth.uid() or private.is_admin_user());

create table if not exists public.saved_routes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_race_id uuid references public.races(id) on delete set null,
  name text not null,
  modality text not null check (modality in ('running', 'bike', 'other')),
  city text,
  state text,
  country text,
  start_address text,
  finish_address text,
  route_notes text,
  distance_m numeric(12,2) not null default 0,
  route_geojson jsonb,
  is_public boolean not null default false,
  usage_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saved_routes_user_created_idx
  on public.saved_routes (user_id, created_at desc);

create index if not exists saved_routes_public_modality_idx
  on public.saved_routes (is_public, modality, created_at desc);

alter table public.saved_routes enable row level security;

drop policy if exists saved_routes_select on public.saved_routes;
create policy saved_routes_select on public.saved_routes
for select using (
  is_public = true
  or user_id = auth.uid()
  or private.is_admin_user()
);

drop policy if exists saved_routes_insert on public.saved_routes;
create policy saved_routes_insert on public.saved_routes
for insert with check (user_id = auth.uid() or private.is_admin_user());

drop policy if exists saved_routes_update on public.saved_routes;
create policy saved_routes_update on public.saved_routes
for update using (user_id = auth.uid() or private.is_admin_user())
with check (user_id = auth.uid() or private.is_admin_user());

drop policy if exists saved_routes_delete on public.saved_routes;
create policy saved_routes_delete on public.saved_routes
for delete using (user_id = auth.uid() or private.is_admin_user());

create or replace function public.set_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists saved_routes_set_updated_at on public.saved_routes;
create trigger saved_routes_set_updated_at
before update on public.saved_routes
for each row execute function public.set_timestamp_updated_at();
