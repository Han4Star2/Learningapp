# LearningApp — CRUD Learning Platform

A clean, production-ready **Next.js App Router + Supabase** platform.
Each user can create **School Years**, add **Subjects** inside them, and
fully manage both (create / read / update / delete). No AI, uploads,
queues, embeddings, or analytics — this is the structured data core that
later AI phases build on.

## Stack

- **Next.js 15** — App Router, Server Components, Server Actions, TypeScript
- **Supabase** — Postgres + Auth via `@supabase/ssr` (cookie sessions)
- **Tailwind CSS**
- Deploys to **Vercel** with zero config

## File structure

```
learningapp/
├─ app/
│  ├─ (auth)/                       # login & register (route group)
│  │  ├─ layout.tsx · login/page.tsx · register/page.tsx
│  ├─ dashboard/
│  │  ├─ layout.tsx                 # top bar (email + logout), auth guard
│  │  ├─ loading.tsx                # skeleton loading state
│  │  ├─ error.tsx                  # error boundary (retry)
│  │  ├─ page.tsx                   # overview — lists school years
│  │  └─ years/
│  │     ├─ new/page.tsx            # create school year
│  │     └─ [yearId]/
│  │        ├─ page.tsx             # lists subjects in the year
│  │        ├─ edit/page.tsx        # edit school year
│  │        └─ subjects/
│  │           ├─ new/page.tsx      # create subject
│  │           └─ [subjectId]/edit/page.tsx   # edit subject
│  ├─ globals.css · layout.tsx · page.tsx
├─ actions/
│  ├─ auth.ts                       # login / register / logout
│  ├─ school-years.ts               # create / update / delete
│  └─ subjects.ts                   # create / update / delete
├─ components/
│  ├─ ui.tsx                        # Input / Button / Card / buttonClass
│  ├─ delete-button.tsx             # confirm + pending delete (client)
│  ├─ year-form.tsx                 # create/edit year form (client)
│  ├─ subject-form.tsx              # create/edit subject form (client)
│  └─ clsx.ts
├─ lib/
│  ├─ auth.ts                       # requireUser() helper
│  └─ supabase/{client,server,middleware}.ts
├─ types/domain.ts                  # SchoolYear, Subject, FormState
├─ middleware.ts                    # session refresh + route protection
└─ supabase/migrations/
   ├─ 0001_init.sql                 # profiles + signup trigger
   └─ 0002_school_years_subjects.sql# school_years + subjects + RLS
```

## Routes

| Route | Purpose |
|---|---|
| `/dashboard` | Overview — all your school years (cards) |
| `/dashboard/years/new` | Create a school year |
| `/dashboard/years/[yearId]` | Subjects inside a year (cards) |
| `/dashboard/years/[yearId]/edit` | Rename a school year |
| `/dashboard/years/[yearId]/subjects/new` | Create a subject |
| `/dashboard/years/[yearId]/subjects/[subjectId]/edit` | Edit a subject |

## Database

Two migrations under `supabase/migrations/`:

- **`0001_init.sql`** — `profiles` table (extends `auth.users`) + a trigger
  that auto-creates a profile on signup.
- **`0002_school_years_subjects.sql`** — the CRUD core:

```
school_years
  id          uuid  pk
  user_id     uuid  → auth.users(id)
  name        text
  created_at  timestamptz

subjects
  id              uuid  pk
  user_id         uuid  → auth.users(id)
  school_year_id  uuid  → school_years(id)  (cascade delete)
  name            text
  created_at      timestamptz
```

### RLS (security)

Both tables have **Row Level Security enabled**, with one policy per
operation scoped to the owner:

```sql
using (auth.uid() = user_id)            -- select / update / delete
with check (auth.uid() = user_id)       -- insert / update
```

A user can only ever read or write their own rows — enforced by Postgres,
not application code. Server Actions additionally stamp `user_id` from the
authenticated session on insert.

## Setup (local)

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
   Copy the **Project URL** and **anon public key** (Project Settings → API).
2. **Run the SQL.** In the Supabase **SQL Editor**, run
   `0001_init.sql` then `0002_school_years_subjects.sql` (in order).
3. **(Dev) disable email confirmation:** Authentication → Providers → Email
   → turn off "Confirm email" so signup logs you straight in.
4. **Env vars:**
   ```bash
   cp .env.example .env.local
   ```
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
5. **Run:**
   ```bash
   npm install
   npm run dev
   ```
   http://localhost:3000 → register → create a year → add subjects.

## Deploy: GitHub + Vercel

1. **Push to GitHub** (this repo).
2. **Import** at [vercel.com/new](https://vercel.com/new) — Next.js is
   auto-detected; keep defaults.
3. Add env vars `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` under **Project → Settings →
   Environment Variables**.
4. **Deploy.**
5. In Supabase → **Authentication → URL Configuration**, set **Site URL**
   and add a **Redirect URL** for your `https://your-app.vercel.app` domain.

> The anon key is meant to be public (it ships to the browser); access
> control is enforced by RLS, not by hiding the key.

## How it works

- **Sessions** live in cookies via `@supabase/ssr`; `middleware.ts`
  refreshes them and guards routes (`/dashboard` requires auth).
- **Reads** happen in Server Components using the server Supabase client —
  already scoped to the user by RLS.
- **Writes** go through **Server Actions** (`actions/*`) that validate
  input, return `{ error }` for inline form messages, then
  `revalidatePath` + `redirect` on success.
- **Loading & error states**: `dashboard/loading.tsx` shows a skeleton on
  navigation; `dashboard/error.tsx` catches render/query errors with a
  retry button; forms show pending state and validation errors inline.

## Scaling toward AI (later)

The structure is intentionally extensible: add new tables (e.g.
`documents`, `materials`) with the same `user_id` + RLS pattern, nest new
routes under `dashboard/years/[yearId]/subjects/[subjectId]/…`, and add
Server Actions or a `lib/ai/` layer — no refactor of the core needed.
