# LearningApp — Foundation MVP

Minimal, production-ready **Next.js App Router + Supabase** foundation:
email/password auth, a protected dashboard, and a single `profiles`
table. No AI, uploads, queues, or embeddings — those come in later
phases on top of this base.

## Stack

- **Next.js 15** — App Router, Server Components, Server Actions, TypeScript
- **Supabase** — Postgres + Auth via `@supabase/ssr` (cookie sessions)
- **Tailwind CSS**
- Deploys to **Vercel** with zero config

## File structure

```
learningapp/
├─ app/
│  ├─ (auth)/                # route group — no /auth URL prefix
│  │  ├─ layout.tsx          # centered card layout
│  │  ├─ login/page.tsx
│  │  └─ register/page.tsx
│  ├─ dashboard/
│  │  ├─ layout.tsx          # top bar (user email + logout), auth guard
│  │  └─ page.tsx            # protected page, reads profile
│  ├─ globals.css
│  ├─ layout.tsx             # root layout
│  └─ page.tsx               # redirects → /dashboard or /login
├─ actions/
│  └─ auth.ts                # Server Actions: login / register / logout
├─ components/
│  ├─ clsx.ts                # tiny className joiner
│  └─ ui.tsx                 # Input / Button / Card primitives
├─ lib/supabase/
│  ├─ client.ts              # browser client (Client Components)
│  ├─ server.ts              # server client (RSC / Server Actions)
│  └─ middleware.ts          # session refresh + route protection
├─ middleware.ts             # wires updateSession into Next.js
├─ supabase/migrations/0001_init.sql   # profiles table + RLS + trigger
├─ .env.example
└─ (config: package.json, tsconfig, next.config, tailwind, postcss)
```

## Database (minimal)

One table. Run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
in the Supabase **SQL Editor**:

- `profiles` — `id (uuid, FK auth.users)`, `full_name`, `created_at`
- **RLS**: users can select/update only their own row
- **Trigger**: `on_auth_user_created` auto-inserts a profile on signup,
  copying `full_name` from the signup metadata

## Setup (local)

### 1. Supabase project
Create one at [supabase.com](https://supabase.com). From
**Project Settings → API** copy the **Project URL** and **anon public key**.

### 2. Schema
Open **SQL Editor**, paste `supabase/migrations/0001_init.sql`, run it.

### 3. (Dev convenience) email confirmation
**Authentication → Providers → Email → disable "Confirm email"** so
signup logs you in immediately. Re-enable for production.

### 4. Environment variables
```bash
cp .env.example .env.local
```
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Run
```bash
npm install
npm run dev
```
http://localhost:3000 → register → you land on the protected dashboard.

## Deploy: GitHub + Vercel

### 1. Push to GitHub
```bash
git init                     # skip if already a repo
git add -A
git commit -m "Foundation MVP"
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

### 2. Import into Vercel
1. Go to [vercel.com/new](https://vercel.com/new) → **Import** your repo.
2. Framework preset auto-detects **Next.js** — keep defaults.
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Deploy.**

### 3. Point Supabase at your Vercel URL
In Supabase → **Authentication → URL Configuration**:
- **Site URL**: `https://your-app.vercel.app`
- Add the same to **Redirect URLs**

> The anon key is safe to expose in the browser — access control is
> enforced by Postgres RLS, not by hiding the key.

## How it works

- **Sessions**: `@supabase/ssr` stores the auth session in cookies.
  `middleware.ts` refreshes it on every request.
- **Route protection**: middleware redirects unauthenticated users away
  from `/dashboard` and authenticated users away from `/login`/`/register`;
  the dashboard layout re-checks server-side as a second line of defense.
- **Mutations**: login/register/logout are Server Actions in
  `actions/auth.ts` — no API routes needed.
