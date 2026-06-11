-- ============================================================
-- 0003 — AI Study Assistant core
-- Pivots the data model to: subjects · teachers · documents ·
-- ai_generated_content · document_chunks (future RAG).
-- Replaces the school-year structure. Every table is user-scoped
-- and protected by RLS. Run AFTER 0001 (profiles).
-- ============================================================

-- Remove the superseded school-year structure.
drop table if exists public.subjects cascade;
drop table if exists public.school_years cascade;

-- pgvector for document_chunks.embedding (provisioned now, populated later).
create extension if not exists vector;

-- Enums
do $$ begin
  create type public.document_type as enum ('exam','notes','worksheet','textbook');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ai_content_type as enum ('exam','quiz','flashcards');
exception when duplicate_object then null; end $$;

-- ── subjects (the central unit) ─────────────────────────────
create table public.subjects (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);
create index subjects_user_idx on public.subjects (user_id);

-- ── teachers (style sources; loosely coupled) ───────────────
create table public.teachers (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);
create index teachers_user_idx on public.teachers (user_id);

-- ── documents (CONTENT layer; teacher_id ties exams to STYLE) ──
create table public.documents (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  subject_id   uuid not null references public.subjects(id) on delete cascade,
  teacher_id   uuid references public.teachers(id) on delete set null,
  type         public.document_type not null,
  title        text not null,
  content      text,            -- extracted/pasted text — the AI-readable layer
  storage_path text,            -- optional original file in Supabase Storage
  created_at   timestamptz not null default now()
);
create index documents_subject_idx on public.documents (subject_id);
create index documents_teacher_idx on public.documents (teacher_id);
create index documents_user_idx    on public.documents (user_id);

-- ── ai_generated_content (exams / quizzes / flashcards) ─────
create table public.ai_generated_content (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  subject_id          uuid not null references public.subjects(id) on delete cascade,
  teacher_id          uuid references public.teachers(id) on delete set null,
  type                public.ai_content_type not null,
  title               text not null,
  content_json        jsonb not null,
  source_document_ids uuid[] not null default '{}',
  created_at          timestamptz not null default now()
);
create index ai_generated_subject_idx on public.ai_generated_content (subject_id);
create index ai_generated_user_idx    on public.ai_generated_content (user_id);

-- ── document_chunks (future RAG; provisioned, not populated) ──
create table public.document_chunks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  content     text not null,
  embedding   vector(1536),
  metadata    jsonb not null default '{}'
);
create index document_chunks_document_idx on public.document_chunks (document_id);

-- ============================================================
-- RLS — owner-only access on every table, per operation.
-- ============================================================
alter table public.subjects             enable row level security;
alter table public.teachers             enable row level security;
alter table public.documents            enable row level security;
alter table public.ai_generated_content enable row level security;
alter table public.document_chunks      enable row level security;

-- subjects
create policy "subjects_select" on public.subjects for select using (auth.uid() = user_id);
create policy "subjects_insert" on public.subjects for insert with check (auth.uid() = user_id);
create policy "subjects_update" on public.subjects for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "subjects_delete" on public.subjects for delete using (auth.uid() = user_id);

-- teachers
create policy "teachers_select" on public.teachers for select using (auth.uid() = user_id);
create policy "teachers_insert" on public.teachers for insert with check (auth.uid() = user_id);
create policy "teachers_update" on public.teachers for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "teachers_delete" on public.teachers for delete using (auth.uid() = user_id);

-- documents
create policy "documents_select" on public.documents for select using (auth.uid() = user_id);
create policy "documents_insert" on public.documents for insert with check (auth.uid() = user_id);
create policy "documents_update" on public.documents for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "documents_delete" on public.documents for delete using (auth.uid() = user_id);

-- ai_generated_content
create policy "ai_content_select" on public.ai_generated_content for select using (auth.uid() = user_id);
create policy "ai_content_insert" on public.ai_generated_content for insert with check (auth.uid() = user_id);
create policy "ai_content_delete" on public.ai_generated_content for delete using (auth.uid() = user_id);

-- document_chunks
create policy "chunks_select" on public.document_chunks for select using (auth.uid() = user_id);
create policy "chunks_insert" on public.document_chunks for insert with check (auth.uid() = user_id);
create policy "chunks_delete" on public.document_chunks for delete using (auth.uid() = user_id);

-- ============================================================
-- Storage — private 'documents' bucket; users only touch their
-- own folder:  {user_id}/{uuid}/{filename}
-- ============================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "documents_bucket_own" on storage.objects
  for all
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
