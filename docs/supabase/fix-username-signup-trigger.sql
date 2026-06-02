create or replace function private.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'auth'
as $function$
declare
  requested_username text;
  final_username text;
begin
  requested_username := nullif(trim(new.raw_user_meta_data ->> 'username'), '');

  final_username := coalesce(
    requested_username,
    nullif(
      regexp_replace(
        coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, 'pilot'), '@', 1), 'pilot'),
        '[^a-zA-Z0-9_.-]+',
        '',
        'g'
      ),
      ''
    ),
    split_part(coalesce(new.email, 'pilot'), '@', 1),
    'pilot'
  );

  if final_username !~ '^[A-Za-z0-9_.-]{3,24}$' then
    raise exception using
      errcode = '22023',
      message = 'Invalid username format';
  end if;

  if exists (
    select 1
    from public.profiles profile
    where lower(profile.username) = lower(final_username)
      and profile.id <> new.id
  ) then
    raise exception using
      errcode = '23505',
      message = 'Username already exists';
  end if;

  insert into public.profiles (
    id,
    display_name,
    avatar_url,
    username,
    email,
    country,
    state,
    city,
    birthdate,
    gender,
    bio,
    website,
    is_public,
    is_admin,
    created_at
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, 'Pilot'), '@', 1), 'Pilot'),
    '',
    final_username,
    new.email,
    '',
    '',
    '',
    null,
    '',
    '',
    '',
    true,
    lower(coalesce(new.email, '')) = 'egeohub101@gmail.com',
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    is_admin = public.profiles.is_admin or excluded.is_admin;

  return new;
end;
$function$;
