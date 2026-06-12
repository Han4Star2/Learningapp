# Deployment Guide — StudyAI

End-to-end setup for the AI Study Assistant: Supabase (database, auth,
storage), environment variables, and Vercel. Follow top to bottom.

---

## 1. Supabase setup

1. Create a project at [supabase.com](https://supabase.com) (any region).
2. **Project Settings → API** — copy these three values for later:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **`anon` public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - (the `service_role` key is **not** used by this app — leave it out)
3. *(Local dev convenience)* **Authentication → Providers → Email** →
   turn **off** "Confirm email" so sign-up logs you straight in. Turn it
   back on for production.

---

## 2. SQL migration order

Open **SQL Editor** in the Supabase dashboard and run these **in order**.
Each is idempotent enough to paste-and-run once.

| Step | File | What it does |
|------|------|--------------|
| 1 | `supabase/migrations/0001_init.sql` | `profiles` table + a trigger that auto-creates a profile row on sign-up |
| 2 | `supabase/migrations/0003_ai_study_assistant.sql` | The full app schema: `subjects`, `teachers`, `documents`, `ai_generated_content`, `document_chunks`; all RLS policies; the `pgvector` extension; and the private `documents` storage bucket + its access policy |

> **Skip `0002_school_years_subjects.sql`.** It belongs to an earlier
> (school-year) design that `0003` supersedes — `0003` drops those tables.
> On a fresh project, run `0001` then `0003` only.

After running, verify under **Table Editor** that `subjects`, `teachers`,
`documents`, `ai_generated_content`, and `document_chunks` exist, and under
**Authentication → Policies** that each shows RLS enabled.

---

## 3. Storage bucket setup

**Nothing manual to do** — migration `0003` already:

- creates a **private** bucket named `documents`
  (`insert into storage.buckets ... public = false`), and
- adds a policy on `storage.objects` that lets a user read/write **only**
  files under their own `{user_id}/…` folder.

To confirm: **Storage** should list a `documents` bucket marked *Private*.
Uploaded files are stored at `…/{user_id}/{uuid}/{filename}` and are never
publicly accessible — the app reaches them through the authenticated client.

> File upload is **optional** — documents are usable with pasted text alone
> (text is what the AI reads). The bucket only stores original-file
> attachments.

---

## 4. Environment variables

Copy the template and fill in the values from step 1:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=sk-ant-...
```

| Variable | Where it's used | Notes |
|----------|-----------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | Safe to expose (it's a URL) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | Safe to expose — security is enforced by RLS, not by hiding the key |
| `ANTHROPIC_API_KEY` | **server only** | Never prefixed `NEXT_PUBLIC_`, so it never ships to the browser. Get one at [platform.claude.com](https://platform.claude.com) |

Run locally to verify:

```bash
npm install
npm run dev      # http://localhost:3000
```

---

## 5. Vercel deployment

1. Push this repo to GitHub.
2. [vercel.com/new](https://vercel.com/new) → **Import** the repo. Next.js
   is auto-detected — keep the default build settings.
3. **Settings → Environment Variables** — add all three from step 4
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `ANTHROPIC_API_KEY`) for the Production (and Preview) environments.
4. **Deploy.**
5. Back in Supabase → **Authentication → URL Configuration**: set the
   **Site URL** and add a **Redirect URL** for your
   `https://your-app.vercel.app` domain.

### Function timeout (important)

AI generation runs **synchronously** inside a Server Action. The generate
route sets `export const maxDuration = 60` — the **Vercel Hobby** ceiling,
so it deploys on every plan. A large exam can occasionally need longer; on
**Pro/Enterprise** you may raise it (e.g. `300`) in
`app/(app)/subjects/[id]/generate/page.tsx`. If a generation times out,
reduce the question/card count and retry.

---

## 6. First-user walkthrough

1. **Register** at `/register` (or `/` → it redirects). With email
   confirmation off (step 1.3) you land straight on the dashboard.
2. **Create a subject** — e.g. "Mathematics". It appears in the sidebar and
   becomes the central unit everything hangs off.
3. *(Optional)* **Add a teacher** under **Teachers** — e.g. "Mr. Smith".
   This is the *style* source.
4. **Open the subject → Documents tab → Add document.** For each item:
   - paste the **text content** (required — this is what the AI reads),
   - pick a **type** (`exam` / `notes` / `worksheet` / `textbook`),
   - for past **exams**, tag the **teacher** so the AI can learn their style,
   - optionally attach the original file.
   Add at least one document with real text before generating.
5. **Generate tab** — choose **Exam**, **Quiz**, or **Flashcards**, pick a
   teacher (optional), set count/difficulty (and total marks for exams), and
   click generate. The model reads *all* subject documents (the **content**
   layer) plus the chosen teacher's past exams (the **style** layer).
6. You're redirected to the result in the **Library**:
   - **Exam** — questions with marks, difficulty, topic, and collapsible
     answers + marking schemes.
   - **Quiz** — short questions with a show/hide-answers toggle.
   - **Flashcards** — flip-through deck.
   Everything is saved; revisit anytime from the **Library** tab.

### Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Redirected to `/login` immediately | Not signed in, or Supabase env vars wrong/missing |
| "This subject has no documents with text content yet" | Add a document with pasted **text** (not just a file) |
| "AI generation failed: ANTHROPIC_API_KEY is not set" | Add the key in Vercel env vars and redeploy |
| "The result was too long and got cut off" | Lower the question/card count and regenerate |
| Generation times out on Vercel | Hobby caps functions at 60s — reduce count, or raise `maxDuration` on Pro |
| Upload fails | File over 20 MB, or you're signed out — re-check session |
