import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Exam } from "@/lib/ai/schemas";

const DIFFICULTY_STYLE: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  hard: "bg-rose-100 text-rose-800",
};

export function ExamView({ exam }: { exam: Exam }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-2 p-5">
          <h2 className="text-lg font-semibold">{exam.title}</h2>
          <p className="text-sm text-muted-foreground">
            {exam.total_marks} marks · {exam.duration_minutes} minutes ·{" "}
            {exam.questions.length} questions
          </p>
        </CardContent>
      </Card>

      {exam.questions.map((q) => (
        <Card key={q.number}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">
                {q.number}. {q.prompt}
              </p>
              <Badge variant="secondary" className="shrink-0">
                {q.marks} marks
              </Badge>
            </div>
            <div className="mt-2 flex gap-2 text-xs">
              <span
                className={cn(
                  "rounded px-2 py-0.5 capitalize",
                  DIFFICULTY_STYLE[q.difficulty] ?? "bg-muted text-muted-foreground"
                )}
              >
                {q.difficulty}
              </span>
              <span className="rounded bg-muted px-2 py-0.5 text-muted-foreground">
                {q.topic}
              </span>
            </div>
            <details className="mt-3 rounded-md bg-muted/60 p-3 text-sm">
              <summary className="cursor-pointer font-medium">
                Answer &amp; marking scheme
              </summary>
              <p className="mt-2 whitespace-pre-wrap">{q.answer}</p>
              <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                <span className="font-medium">Marking:</span> {q.marking_scheme}
              </p>
            </details>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
