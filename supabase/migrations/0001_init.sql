-- ============================================================
-- LearningApp — MVP schema (Phase 0 + Phase 1)
-- Tables: profiles, school_years, subjects
-- All user data isolated via Row Level Security (RLS).
-- ============================================================

-- ---------- profiles (extends auth.users) ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- school_years ----------
create table if not exists public.school_years (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  level      int,
  created_at timestamptz not null default now()
);

create index if not exists school_years_user_id_idx
  on public.school_years (user_id);

alter table public.school_years enable row level security;

create policy "school_years_select_own" on public.school_years
  for select using (auth.uid() = user_id);
create policy "school_years_insert_own" on public.school_years
  for insert with check (auth.uid() = user_id);
create policy "school_years_update_own" on public.school_years
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "school_years_delete_own" on public.school_years
  for delete using (auth.uid() = user_id);

-- ---------- subjects ----------
create table if not exists public.subjects (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  school_year_id uuid not null references public.school_years(id) on delete cascade,
  name           text not null,
  color          text,
  created_at     timestamptz not null default now()
);

create index if not exists subjects_user_id_idx
  on public.subjects (user_id);
create index if not exists subjects_school_year_id_idx
  on public.subjects (school_year_id);

alter table public.subjects enable row level security;

create policy "subjects_select_own" on public.subjects
  for select using (auth.uid() = user_id);
create policy "subjects_insert_own" on public.subjects
  for insert with check (auth.uid() = user_id);
create policy "subjects_update_own" on public.subjects
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "subjects_delete_own" on public.subjects
  for delete using (auth.uid() = user_id);
