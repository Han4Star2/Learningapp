-- ============================================================
-- 0004 — Subject colour
-- Adds a `color` accent to subjects for the dashboard cards.
-- Stored as a short token (e.g. 'blue', 'emerald') resolved to
-- Tailwind classes in the UI. Run AFTER 0003.
-- ============================================================

alter table public.subjects
  add column if not exists color text not null default 'slate';
