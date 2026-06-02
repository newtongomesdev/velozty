alter table public.profiles
  add column if not exists username_updated_at timestamptz;

create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username));
