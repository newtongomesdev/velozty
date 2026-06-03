insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'velozty-media',
  'velozty-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.social_posts
  add column if not exists image_url text;

create table if not exists public.profile_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  caption text,
  created_at timestamptz not null default now()
);

alter table public.profile_photos enable row level security;

drop policy if exists profile_photos_select on public.profile_photos;
create policy profile_photos_select on public.profile_photos
for select using (
  exists (
    select 1
    from public.profiles profile
    where profile.id = profile_photos.user_id
      and (profile.is_public = true or profile.id = auth.uid() or private.is_admin_user())
  )
);

drop policy if exists profile_photos_insert on public.profile_photos;
create policy profile_photos_insert on public.profile_photos
for insert with check (user_id = auth.uid() or private.is_admin_user());

drop policy if exists profile_photos_delete on public.profile_photos;
create policy profile_photos_delete on public.profile_photos
for delete using (user_id = auth.uid() or private.is_admin_user());

create table if not exists public.profile_volts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  caption text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists profile_volts_user_active_idx
  on public.profile_volts (user_id, expires_at desc, created_at desc);

alter table public.profile_volts enable row level security;

drop policy if exists profile_volts_select on public.profile_volts;
create policy profile_volts_select on public.profile_volts
for select using (
  expires_at > now()
  and exists (
    select 1
    from public.profiles profile
    where profile.id = profile_volts.user_id
      and (profile.is_public = true or profile.id = auth.uid() or private.is_admin_user())
  )
);

drop policy if exists profile_volts_insert on public.profile_volts;
create policy profile_volts_insert on public.profile_volts
for insert with check (
  user_id = auth.uid()
  and expires_at <= now() + interval '24 hours' + interval '5 minutes'
);

drop policy if exists profile_volts_delete on public.profile_volts;
create policy profile_volts_delete on public.profile_volts
for delete using (user_id = auth.uid() or private.is_admin_user());

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('social_like', 'comment_like', 'message', 'upcoming_race', 'system')),
  title text not null,
  body text,
  target_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
for select using (user_id = auth.uid() or private.is_admin_user());

drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert on public.notifications
for insert with check (
  user_id = auth.uid()
  or private.is_admin_user()
  or (
    actor_user_id = auth.uid()
    and type in ('social_like', 'comment_like', 'message')
    and user_id <> actor_user_id
  )
);

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications
for update using (user_id = auth.uid() or private.is_admin_user())
with check (user_id = auth.uid() or private.is_admin_user());

drop policy if exists notifications_delete on public.notifications;
create policy notifications_delete on public.notifications
for delete using (user_id = auth.uid() or private.is_admin_user());

create table if not exists public.strava_connections (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  athlete_id bigint,
  athlete_name text,
  scope text,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.strava_connections enable row level security;

drop policy if exists strava_connections_select on public.strava_connections;
create policy strava_connections_select on public.strava_connections
for select using (user_id = auth.uid() or private.is_admin_user());

drop policy if exists strava_connections_insert on public.strava_connections;
create policy strava_connections_insert on public.strava_connections
for insert with check (user_id = auth.uid() or private.is_admin_user());

drop policy if exists strava_connections_update on public.strava_connections;
create policy strava_connections_update on public.strava_connections
for update using (user_id = auth.uid() or private.is_admin_user())
with check (user_id = auth.uid() or private.is_admin_user());

drop policy if exists strava_connections_delete on public.strava_connections;
create policy strava_connections_delete on public.strava_connections
for delete using (user_id = auth.uid() or private.is_admin_user());

drop policy if exists velozty_media_select on storage.objects;
create policy velozty_media_select on storage.objects
for select using (bucket_id = 'velozty-media');

drop policy if exists velozty_media_insert_own_folder on storage.objects;
create policy velozty_media_insert_own_folder on storage.objects
for insert with check (
  bucket_id = 'velozty-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists velozty_media_update_own_folder on storage.objects;
create policy velozty_media_update_own_folder on storage.objects
for update using (
  bucket_id = 'velozty-media'
  and auth.uid()::text = (storage.foldername(name))[1]
) with check (
  bucket_id = 'velozty-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists velozty_media_delete_own_folder on storage.objects;
create policy velozty_media_delete_own_folder on storage.objects
for delete using (
  bucket_id = 'velozty-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create table if not exists public.profile_volt_likes (
  volt_id uuid not null references public.profile_volts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (volt_id, user_id)
);

create index if not exists profile_volt_likes_volt_idx
  on public.profile_volt_likes (volt_id);

alter table public.profile_volt_likes enable row level security;

drop policy if exists profile_volt_likes_select on public.profile_volt_likes;
create policy profile_volt_likes_select on public.profile_volt_likes
for select using (true);

drop policy if exists profile_volt_likes_insert on public.profile_volt_likes;
create policy profile_volt_likes_insert on public.profile_volt_likes
for insert with check (user_id = auth.uid());

drop policy if exists profile_volt_likes_delete on public.profile_volt_likes;
create policy profile_volt_likes_delete on public.profile_volt_likes
for delete using (user_id = auth.uid());

