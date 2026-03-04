-- TurnDeck Supabase Schema
-- Paste and run this in your Supabase SQL Editor (Database > SQL Editor)

-- Profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar text,
  joined_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Playlists
create table if not exists playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  playlist_id text not null,
  platform text not null default 'spotify',
  name text,
  url text,
  source text default 'manual',
  category text default '',
  notes text default '',
  tags jsonb default '[]',
  archived boolean default false,
  archived_at timestamptz,
  sort_order integer default 0,
  added_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_playlists_user on playlists(user_id);

-- Categories
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order integer default 0,
  created_at timestamptz default now(),
  unique(user_id, name)
);

-- Settings
create table if not exists settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rotation_mode text default 'playlist_end',
  interval_minutes integer default 30,
  fallback_playlist_id text default '37i9dQZEVXbKY7jLzlJ11V',
  enabled boolean default false,
  current_playlist_index integer default 0,
  updated_at timestamptz default now()
);

-- Platform Accounts
create table if not exists platform_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null,
  username text,
  profile_url text,
  updated_at timestamptz default now(),
  unique(user_id, platform)
);

-- Song Stats
create table if not exists stats_songs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track_uri text not null,
  name text,
  artist text,
  platform text default 'spotify',
  playlist_id text,
  total_count integer default 0,
  daily_counts jsonb default '{}',
  last_played_at timestamptz,
  unique(user_id, track_uri)
);
create index if not exists idx_stats_songs_user on stats_songs(user_id);

-- Playlist Stats
create table if not exists stats_playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  playlist_id text not null,
  name text,
  total_count integer default 0,
  last_played_at timestamptz,
  unique(user_id, playlist_id)
);
create index if not exists idx_stats_playlists_user on stats_playlists(user_id);

-- Activity Log
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text,
  description text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);
create index if not exists idx_activity_user on activity_log(user_id);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table playlists enable row level security;
alter table categories enable row level security;
alter table settings enable row level security;
alter table platform_accounts enable row level security;
alter table stats_songs enable row level security;
alter table stats_playlists enable row level security;
alter table activity_log enable row level security;

-- RLS Policies (users can only access their own rows)
create policy "own_profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own_playlists" on playlists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_categories" on categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_settings" on settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_platform_accounts" on platform_accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_stats_songs" on stats_songs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_stats_playlists" on stats_playlists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_activity_log" on activity_log for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create profile row when a new user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, joined_at)
  values (new.id, now())
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
