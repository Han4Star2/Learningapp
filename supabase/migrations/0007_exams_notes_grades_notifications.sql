-- ============================================================
-- 0007 — Exams · Notes · Grades · Notifications
-- Extends the schema with four user-scoped tables.
-- All tables follow the same conventions as 0003:
--   • uuid PK via gen_random_uuid()
--   • user_id → auth.users ON DELETE CASCADE
--   • RLS enabled; per-operation policies, owner-only
-- Run AFTER 0003.
-- ============================================================

-- ── exams ───────────────────────────────────────────────────
-- Tracks real / past exam sittings per subject.
-- teacher_id is optional (style link, mirrors documents).
-- file_url stores an uploaded scan; extracted_text is the
-- OCR / AI-readable layer (nullable until extraction runs).
create table public.exams (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users(id)     on delete cascade,
  subject_id     uuid        not null references public.subjects(id) on delete cascade,
  teacher_id     uuid                 references public.teachers(id) on delete set null,
  date_of_exam   date,
  file_url       text,
  extracted_text text,
  created_at     timestamptz not null default now()
);

create index exams_user_idx    on public.exams (user_id);
create index exams_subject_idx on public.exams (subject_id);
create index exams_teacher_idx on public.exams (teacher_id);

-- ── notes ───────────────────────────────────────────────────
-- User-created or scanned notes attached to a subject.
-- note_date lets users record when the note was written,
-- independent of the upload timestamp.
create table public.notes (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users(id)     on delete cascade,
  subject_id     uuid        not null references public.subjects(id) on delete cascade,
  file_url       text,
  extracted_text text,
  note_date      date,
  created_at     timestamptz not null default now()
);

create index notes_user_idx    on public.notes (user_id);
create index notes_subject_idx on public.notes (subject_id);

-- ── grades ──────────────────────────────────────────────────
-- Records a single grade event (e.g. 72 / 100) for a subject.
-- grade_value and max_value are numeric to support decimals
-- (e.g. 8.5 / 10).
create table public.grades (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id)     on delete cascade,
  subject_id  uuid        not null references public.subjects(id) on delete cascade,
  grade_value numeric     not null,
  max_value   numeric     not null default 100,
  created_at  timestamptz not null default now(),
  constraint grades_values_positive check (grade_value >= 0 and max_value > 0),
  constraint grades_value_lte_max   check (grade_value <= max_value)
);

create index grades_user_idx    on public.grades (user_id);
create index grades_subject_idx on public.grades (subject_id);

-- ── notifications ────────────────────────────────────────────
-- In-app notifications. `type` is a free-form token
-- (e.g. 'grade_added', 'exam_due', 'generation_complete').
-- is_read defaults to false; updated by the client on open.
create table public.notifications (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  type       text        not null,
  message    text        not null,
  is_read    boolean     not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx      on public.notifications (user_id);
create index notifications_unread_idx   on public.notifications (user_id) where is_read = false;

-- ============================================================
-- RLS — owner-only access on every table, per operation.
-- ============================================================
alter table public.exams          enable row level security;
alter table public.notes          enable row level security;
alter table public.grades         enable row level security;
alter table public.notifications  enable row level security;

-- exams
create policy "exams_select" on public.exams
  for select using (auth.uid() = user_id);
create policy "exams_insert" on public.exams
  for insert with check (auth.uid() = user_id);
create policy "exams_update" on public.exams
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "exams_delete" on public.exams
  for delete using (auth.uid() = user_id);

-- notes
create policy "notes_select" on public.notes
  for select using (auth.uid() = user_id);
create policy "notes_insert" on public.notes
  for insert with check (auth.uid() = user_id);
create policy "notes_update" on public.notes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notes_delete" on public.notes
  for delete using (auth.uid() = user_id);

-- grades
create policy "grades_select" on public.grades
  for select using (auth.uid() = user_id);
create policy "grades_insert" on public.grades
  for insert with check (auth.uid() = user_id);
create policy "grades_update" on public.grades
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "grades_delete" on public.grades
  for delete using (auth.uid() = user_id);

-- notifications
create policy "notifications_select" on public.notifications
  for select using (auth.uid() = user_id);
create policy "notifications_insert" on public.notifications
  for insert with check (auth.uid() = user_id);
create policy "notifications_update" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notifications_delete" on public.notifications
  for delete using (auth.uid() = user_id);
