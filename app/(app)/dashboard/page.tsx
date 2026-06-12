import { Plus, BookOpen, FileText, Sparkles, Layers } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SubjectCard } from "@/components/subjects/subject-card";
import { SubjectDialog } from "@/components/subjects/subject-dialog";
import type { Subject } from "@/types/domain";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: subjectRows, error }, { data: docRows }, { data: genRows }] =
    await Promise.all([
      supabase.from("subjects").select("*").order("created_at", { ascending: true }),
      supabase.from("documents").select("subject_id"),
      supabase.from("ai_generated_content").select("subject_id"),
    ]);
  if (error) throw new Error(error.message);

  const subjects = (subjectRows ?? []) as Subject[];
  const docCounts = countBySubject(docRows);
  const genCounts = countBySubject(genRows);

  const totalDocs = (docRows ?? []).length;
  const totalGen = (genRows ?? []).length;

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your subjects, documents and generated study material.
          </p>
        </div>
        <SubjectDialog
          trigger={
            <Button>
              <Plus />
              New subject
            </Button>
          }
        />
      </div>

      {/* ── Summary stats ───────────────────────────────── */}
      {subjects.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard icon={<Layers className="size-4" />} value={subjects.length} label="Subjects" />
          <SummaryCard icon={<FileText className="size-4" />} value={totalDocs} label="Documents" />
          <SummaryCard icon={<Sparkles className="size-4" />} value={totalGen} label="Generated items" />
        </div>
      )}

      {/* ── Subject grid ────────────────────────────────── */}
      {subjects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-4 p-14 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
            <BookOpen className="size-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">No subjects yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first subject, then add notes and past exams to start generating.
            </p>
          </div>
          <SubjectDialog
            trigger={
              <Button>
                <Plus />
                Create subject
              </Button>
            }
          />
        </Card>
      ) : (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">All subjects</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject, idx) => (
              <div key={subject.id} style={{ animation: `slide-up 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards`, animationDelay: `${idx * 75}ms`, opacity: 0 }}>
                <SubjectCard
                  subject={subject}
                  documentCount={docCounts[subject.id] ?? 0}
                  generatedCount={genCounts[subject.id] ?? 0}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SummaryCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-xl font-bold leading-none tabular-nums">{value}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function countBySubject(rows: { subject_id: string }[] | null): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows ?? []) {
    counts[row.subject_id] = (counts[row.subject_id] ?? 0) + 1;
  }
  return counts;
}
