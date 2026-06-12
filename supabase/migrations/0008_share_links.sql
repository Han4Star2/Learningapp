-- ============================================================
-- 0008 — Share links
-- Allows read-only public access to subjects or AI-generated
-- content via a random token, no auth required.
-- ============================================================

create table public.share_links (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  token         text        not null unique default encode(gen_random_bytes(24), 'base64url'),
  resource_type text        not null,  -- 'subject' | 'ai_content'
  resource_id   uuid        not null,
  expires_at    timestamptz,           -- null = never expires
  created_at    timestamptz not null default now(),
  constraint share_links_resource_type_check
    check (resource_type in ('subject', 'ai_content'))
);

create index share_links_token_idx    on public.share_links (token);
create index share_links_user_idx     on public.share_links (user_id);
create index share_links_resource_idx on public.share_links (resource_type, resource_id);

alter table public.share_links enable row level security;

-- Owners manage their own links
create policy "share_links_select" on public.share_links
  for select using (auth.uid() = user_id);
create policy "share_links_insert" on public.share_links
  for insert with check (auth.uid() = user_id);
create policy "share_links_delete" on public.share_links
  for delete using (auth.uid() = user_id);

-- Public token lookup (unauthenticated) — read by token only, no user filter
create policy "share_links_public_read" on public.share_links
  for select using (true);
