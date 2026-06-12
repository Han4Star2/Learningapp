import { Plus, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
          <p className="mt-1 text-muted-foreground">
            Each subject holds your documents and powers AI exams, quizzes and
            flashcards.
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

      {subjects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <BookOpen className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No subjects yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first subject, then add notes and past exams to start
              generating.
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              documentCount={docCounts[subject.id] ?? 0}
              generatedCount={genCounts[subject.id] ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function countBySubject(rows: { subject_id: string }[] | null): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows ?? []) {
    counts[row.subject_id] = (counts[row.subject_id] ?? 0) + 1;
  }
  return counts;
}
