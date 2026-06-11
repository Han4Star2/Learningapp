# LearningApp — MVP (Phase 0 + Phase 1)

A minimal, production-clean **Next.js App Router + Supabase** starter:
email/password auth, a protected dashboard, and CRUD for **school years**
and **subjects**. No AI, queues, embeddings, or analytics — those are
later phases.

## Stack

- **Next.js 15** (App Router, Server Components, Server Actions, TypeScript)
- **Supabase** — Postgres + Auth (`@supabase/ssr`)
- **Tailwind CSS**
- Deploys to **Vercel** with zero config

## File structure

```
learningapp/
├─ app/
│  ├─ (auth)/                  # login & register (route group, no /auth prefix)
│  │  ├─ layout.tsx
│  │  ├─ login/page.tsx
│  │  └─ register/page.tsx
│  ├─ dashboard/
│  │  ├─ layout.tsx            # auth guard + header/logout
│  │  ├─ page.tsx              # school years CRUD
│  │  └─ years/[yearId]/page.tsx   # subjects CRUD within a year
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx                 # redirects to /dashboard or /login
├─ actions/                    # Server Actions (mutations)
│  ├─ auth.ts                  # login / register / logout
│  ├─ school-years.ts          # create / delete
│  └─ subjects.ts              # create / delete
├─ components/
│  ├─ clsx.ts
│  └─ ui.tsx                   # Input / Button / Card
├─ lib/supabase/
│  ├─ server.ts                # server-side client (cookies)
│  ├─ client.ts                # browser client
│  └─ middleware.ts            # session refresh + route protection
├─ types/domain.ts
├─ supabase/migrations/0001_init.sql
├─ middleware.ts
└─ (config: next/tsconfig/tailwind/postcss)
```

## Setup

### 1. Create a Supabase project
At [supabase.com](https://supabase.com) → **New project**. Note the
**Project URL** and **anon public key** (Project Settings → API).

### 2. Apply the database schema
In the Supabase dashboard → **SQL Editor**, paste and run the contents of
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
This creates `profiles`, `school_years`, `subjects` with RLS enabled and a
trigger that auto-creates a profile on signup.

### 3. (Dev convenience) email confirmation
For quick local testing, disable email confirmation so signup logs you
straight in: **Authentication → Providers → Email → turn off "Confirm
email"**. Leave it on for production.

### 4. Environment variables
```bash
cp .env.example .env.local
```
Fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Install & run
```bash
npm install
npm run dev
```
Open http://localhost:3000 → register → manage school years & subjects.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Add the two env vars (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in **Project → Settings → Environment
   Variables**.
4. Deploy. (The anon key is safe to expose to the browser — security is
   enforced by Supabase RLS, not by hiding the key.)

## How it works

- **Auth**: `@supabase/ssr` stores the session in cookies. `middleware.ts`
  refreshes it on every request, redirects unauthenticated users away from
  `/dashboard`, and authenticated users away from `/login` & `/register`.
- **Data isolation**: every query is scoped to the logged-in user by
  **RLS policies** (`auth.uid() = user_id`) — not by app-layer filtering.
- **Mutations**: all writes go through **Server Actions** in `actions/`,
  which call `revalidatePath` to refresh the affected page.
```
