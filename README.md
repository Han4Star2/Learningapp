# StudyAI — AI Study Assistant (MVP)

An AI study assistant built on **Next.js App Router + Supabase + Claude**.
Students organize material by **subject**, optionally tag past exams with a
**teacher**, and generate **practice exams, quizzes and flashcards** that
combine two context layers:

- **CONTENT layer** — *what* is taught: the subject's notes, textbook
  extracts, worksheets and past exams.
- **STYLE layer** — *how* it's asked: the chosen teacher's past exams
  (phrasing, structure, mark distribution, difficulty mix).

No queues, no embeddings pipeline, no analytics — AI calls are synchronous
and the schema is provisioned to grow into RAG later.

## Stack

- **Next.js 16** — App Router, RSC, Server Actions, TypeScript
- **Supabase** — Postgres (+pgvector), Auth (`@supabase/ssr`), Storage
- **Anthropic Claude** — `claude-opus-4-8` with structured outputs
  (schema-guaranteed JSON via Zod)
- **Tailwind CSS 4 + shadcn/ui** — SaaS UI: sidebar, cards, dialogs, badges

## Architecture

```
Browser ── Server Actions ──► Next.js (App Router)
   │                             │ reads/writes (RLS-scoped)
   │ direct signed upload        ▼
   └────────► Supabase Storage  Supabase Postgres
                                 subjects · teachers · documents
                                 ai_generated_content · document_chunks
                                 │
        actions/generate.ts ─────┤  fetch CONTENT (subject docs)
                                 │  fetch STYLE  (teacher's past exams)
                                 ▼
                        lib/ai/ (provider seam)
                        buildFrame → messages.parse (Zod schema)
                                 │
                                 ▼
                        Anthropic Claude API (sync, MVP)
```

## File structure

```
app/
├─ (auth)/                       # login / register
├─ (app)/                        # sidebar shell (auth-guarded)
│  ├─ layout.tsx                 # Sidebar (subjects nav) + content area
│  ├─ dashboard/page.tsx         # subjects overview (create/delete)
│  ├─ teachers/page.tsx          # manage teacher style sources
│  └─ subjects/[id]/
│     ├─ layout.tsx              # subject header + tabs
│     ├─ page.tsx                # HUB: docs summary · teachers · AI actions
│     ├─ documents/page.tsx      # add (text + optional file) & list docs
│     ├─ generate/page.tsx       # AI panel: exam | quiz | flashcards
│     └─ library/
│        ├─ page.tsx             # past generations
│        └─ [contentId]/page.tsx # render exam / quiz / flashcards
actions/
├─ auth.ts · subjects.ts · teachers.ts · documents.ts
└─ generate.ts                   # synchronous AI generation
lib/
├─ supabase/{server,client,middleware}.ts · auth.ts
└─ ai/
   ├─ client.ts                  # Anthropic client + MODEL constant
   ├─ schemas.ts                 # Zod: Exam / Quiz / FlashcardSet
   ├─ prompts.ts                 # system prompts (content vs style rule)
   ├─ context.ts                 # two-layer prompt frame + token budget
   └─ generate.ts                # messages.parse → guaranteed JSON
components/
├─ shell/{sidebar,subject-tabs}.tsx
├─ documents/document-form.tsx   # browser → Storage direct upload
├─ generate/generate-panel.tsx
├─ content/{exam-view,quiz-view,flashcard-deck}.tsx
└─ ui.tsx · name-form.tsx · delete-button.tsx · clsx.ts
supabase/migrations/
├─ 0001_init.sql                 # profiles + signup trigger
├─ 0003_ai_study_assistant.sql   # core schema + RLS + storage bucket
└─ 0004_subject_color.sql        # subjects.color accent
```

## Database & security

`supabase/migrations/0003_ai_study_assistant.sql` creates:

| Table | Purpose |
|---|---|
| `subjects` | The central unit (id, user_id, name) |
| `teachers` | Style sources, loosely coupled |
| `documents` | type: exam/notes/worksheet/textbook · `content` text (AI-readable) · optional `storage_path` · optional `teacher_id` |
| `ai_generated_content` | type: exam/quiz/flashcards · `content_json` · `source_document_ids[]` |
| `document_chunks` | pgvector(1536) — provisioned for future RAG, unused in MVP |

**RLS everywhere:** every table is user-scoped; each operation has an
owner-only policy (`auth.uid() = user_id`). The private `documents` Storage
bucket only allows access to `{user_id}/…` paths. Cross-user access is
impossible at the database layer; Server Actions additionally stamp
`user_id` from the session.

## AI pipeline (synchronous MVP)

1. `actions/generate.ts` loads **all subject documents** (CONTENT) and, if a
   teacher is selected, **that teacher's past exams** (STYLE) — both via RLS.
2. `lib/ai/context.ts` merges them into one structured prompt under a
   character budget (per-doc 40k chars; content 400k; style 200k).
3. `lib/ai/generate.ts` calls Claude (`claude-opus-4-8`, adaptive thinking)
   with **structured outputs** — the response is parsed against the Zod
   schema (`ExamSchema` / `QuizSchema` / `FlashcardSetSchema`), so invalid
   JSON is impossible.
4. The result is stored in `ai_generated_content` with provenance
   (`source_document_ids`) and rendered from the library.

The prompt rule enforced in `lib/ai/prompts.ts`: **subject defines WHAT is
asked; teacher defines HOW it is asked** — facts only from CONTENT, style
only from STYLE.

Scale path (no refactor needed): populate `document_chunks` with embeddings
and swap `context.ts` to vector retrieval; move `generate.ts` behind a queue
when needed. Nothing else changes.

## Setup

1. **Supabase project** → SQL Editor → run `0001_init.sql`, then
   `0003_ai_study_assistant.sql`, then `0004_subject_color.sql` (creates
   tables, RLS, the private `documents` bucket, and the subject colour column).
2. *(Dev)* Authentication → Providers → Email → disable "Confirm email".
3. **Anthropic API key** from [platform.claude.com](https://platform.claude.com).
4. Env vars:
   ```bash
   cp .env.example .env.local
   ```
   ```
   NEXT_PUBLIC_SUPABASE_URL=…
   NEXT_PUBLIC_SUPABASE_ANON_KEY=…
   ANTHROPIC_API_KEY=sk-ant-…        # server-only
   ```
5. Run:
   ```bash
   npm install
   npm run dev
   ```
6. Register → create a subject → add documents (paste text; tag exams with a
   teacher) → Generate.

## Deploy (Vercel)

1. Import the repo at vercel.com/new (Next.js auto-detected).
2. Add the three env vars (`ANTHROPIC_API_KEY` is server-side only — it is
   never shipped to the browser).
3. Deploy, then set Supabase **Auth → URL Configuration** to your
   `*.vercel.app` domain.
4. Generation sets `maxDuration = 60` on the generate route (the Vercel Hobby
   ceiling); raise it (e.g. `300`) on Pro/Enterprise in
   `app/(app)/subjects/[id]/generate/page.tsx`.

## Notes & limits (MVP)

- **Document text is required** — it's the AI-readable layer. File upload is
  an optional attachment (original PDFs etc.); automatic PDF/OCR text
  extraction is a later phase, as is the embeddings pipeline.
- AI generation is synchronous: expect ~30–90s for a full exam.
- Costs scale with document volume; the context budget caps worst-case
  prompt size.
