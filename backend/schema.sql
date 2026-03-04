-- AutoDJ Database Schema
-- Run this in Supabase SQL Editor

-- Users table
create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    spotify_user_id text unique not null,
    refresh_token text not null,
    created_at timestamp default now()
);

-- Playlists table
create table if not exists playlists (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    playlist_id text not null,
    name text,
    source text check (source in ('spotify','manual','fallback')),
    active boolean default true,
    created_at timestamp default now()
);

create index if not exists idx_playlists_user on playlists(user_id);

-- Settings table
create table if not exists settings (
    user_id uuid primary key references users(id) on delete cascade,
    rotation_mode text check (rotation_mode in ('interval','playlist_end')) default 'playlist_end',
    interval_minutes integer default 30,
    fallback_playlist_id text default '37i9dQZEVXbKY7jLzlJ11V',
    enabled boolean default false,
    current_playlist_index integer default 0,
    last_switch_at timestamp default now()
);
