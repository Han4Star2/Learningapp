# Supabase Setup — StudyAI

Detailed step-by-step for configuring the Supabase project. Complements
`DEPLOYMENT.md`; read them together.

---

## 1. Create the project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. **New project** → choose your organisation → pick a region close to your
   users → set a strong database password → **Create new project**.
3. Wait ~2 minutes for provisioning to finish.

---

## 2. Collect your API credentials

**Project Settings → API** (left sidebar → ⚙ Settings → API)

| Field in Supabase | Environment variable |
|---|---|
| **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` |
| **`anon` public key** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

> The `service_role` key is **not used** by this app — leave it out entirely.
> Do not put it in `.env.local` or Vercel.

---

## 3. Run the SQL migrations

Open **SQL Editor** (left sidebar → SQL Editor → **New query**) and run the
two files **in order**. Paste each file's full contents and click **Run**.

### Migration 1 — `supabase/migrations/0001_init.sql`

Creates the `profiles` table and a Postgres trigger (`handle_new_user`) that
auto-inserts a profile row whenever a new user signs up via Supabase Auth.

```sql
-- paste contents of supabase/migrations/0001_init.sql here
```

**Verify:** Table Editor → `profiles` exists.

### Migration 2 — `supabase/migrations/0003_ai_study_assistant.sql`

The full production schema:

| Created | Notes |
|---|---|
| `pgvector` extension | Required for `document_chunks.embedding vector(1536)` |
| `document_type` enum | `exam`, `notes`, `worksheet`, `textbook` |
| `ai_content_type` enum | `exam`, `quiz`, `flashcards` |
| `subjects` table | Central unit — each user owns their own |
| `teachers` table | Style sources, loosely coupled to documents |
| `documents` table | Text content (required) + optional file path |
| `ai_generated_content` table | Saved exam / quiz / flashcard sets |
| `document_chunks` table | Provisioned for future RAG (unused in MVP) |
| RLS policies | Owner-only for every table, every operation |
| `documents` storage bucket | Private; path policy `{user_id}/...` |

```sql
-- paste contents of supabase/migrations/0003_ai_study_assistant.sql here
```

> **Do NOT run `0002_school_years_subjects.sql`** — that migration is
> superseded. `0003` drops those tables automatically; running `0002`
> first would create them unnecessarily and then immediately drop them.

**Verify after running:**

- **Table Editor:** `subjects`, `teachers`, `documents`,
  `ai_generated_content`, `document_chunks` all exist.
- **Database → Extensions:** `vector` is listed as enabled.
- **Authentication → Policies:** all five tables show RLS enabled with
  four policies each (or three for `ai_generated_content` /
  `document_chunks`).
- **Storage:** a bucket named `documents` exists and is marked **Private**.

---

## 4. Storage bucket verification

The migration creates the bucket automatically. To confirm:

1. **Storage** (left sidebar) → bucket list should show `documents` with
   **Private** badge.
2. Click the bucket → **Policies** tab → one policy named
   `documents_bucket_own` covering `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
3. The policy expression should read:
   ```sql
   bucket_id = 'documents'
   AND (storage.foldername(name))[1] = auth.uid()::text
   ```
   This means each user can only read and write files under their own
   `{user_id}/` prefix — cross-user access is impossible.

If the bucket is missing (e.g., the migration was run with insufficient
privileges), create it manually:

```sql
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "documents_bucket_own" on storage.objects
  for all
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

## 5. Authentication settings

### Email confirmation (development)

**Authentication → Providers → Email** → toggle **Confirm email** **off**
for local development so sign-up lands you directly on the dashboard.

Turn it **back on** before going to production.

### URL configuration (production / Vercel)

After deploying to Vercel:

1. **Authentication → URL Configuration**
2. Set **Site URL** to `https://your-app.vercel.app`
3. Add a **Redirect URL**: `https://your-app.vercel.app/**`

Without this, Supabase rejects OAuth redirects and magic-link callbacks.

---

## 6. Environment variables

Copy the template:

```bash
cp .env.example .env.local
```

Fill in the values from step 2:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Security rules:**

| Variable | `NEXT_PUBLIC_`? | Why |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Must be readable by the browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Safe — RLS enforces security, not key secrecy |
| `ANTHROPIC_API_KEY` | **Never** | Server-only; would expose your billing account if sent to browser |

---

## 7. Verify locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`:

- `/` → redirects to `/login`
- Register a new account → lands on `/dashboard`
- Create a subject → appears in sidebar
- Add a document → visible in Documents tab
- Attempt generation → calls Claude API and saves to library

---

## 8. RLS policy reference

All tables use the pattern `auth.uid() = user_id`. No cross-user reads or
writes are possible at the database layer regardless of what the application
sends.

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | `auth.uid() = id` | `auth.uid() = id` | `auth.uid() = id` | — |
| `subjects` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `teachers` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `documents` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `ai_generated_content` | `auth.uid() = user_id` | `auth.uid() = user_id` | — | `auth.uid() = user_id` |
| `document_chunks` | `auth.uid() = user_id` | `auth.uid() = user_id` | — | `auth.uid() = user_id` |

---

## 9. Troubleshooting

| Symptom | Fix |
|---|---|
| `supabase.auth.getUser()` returns `null` in dev | Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`; restart `npm run dev` |
| Sign-up succeeds but profile row missing | `0001_init.sql` trigger not installed; re-run the migration |
| Storage upload returns 403 | Check the `documents_bucket_own` policy; verify the file path starts with the user's UUID |
| Vector extension error on migration | The project plan must support pgvector — all Supabase projects on the free plan include it |
| "new row violates row-level security policy" | Make sure the Server Action stamps `user_id: user.id` in all inserts |
| Auth redirect loop | Site URL / Redirect URL not set in Authentication → URL Configuration |
