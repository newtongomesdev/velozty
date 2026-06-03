alter table public.saved_routes
  add column if not exists route_notes text;
