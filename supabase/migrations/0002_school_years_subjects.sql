-- ============================================================
-- LearningApp — school_years + subjects (CRUD core)
-- Additive migration. Run AFTER 0001_init.sql.
-- Every row is owned by a user and isolated via RLS.
-- ============================================================

-- ---------- school_years ----------
create table if not exists public.school_years (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
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
