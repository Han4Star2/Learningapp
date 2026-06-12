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
  const diffCounts = exam.questions.reduce<Record<string, number>>((acc, q) => {
    acc[q.difficulty] = (acc[q.difficulty] ?? 0) + 1;
    return acc;
  }, {});

  const topicCounts = exam.questions.reduce<Record<string, number>>((acc, q) => {
    acc[q.topic] = (acc[q.topic] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">{exam.title}</h2>
            <p className="text-sm text-muted-foreground">
              {exam.total_marks} marks · {exam.duration_minutes} min · {exam.questions.length} questions
            </p>
          </div>

          {/* Difficulty breakdown */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(diffCounts).map(([diff, n]) => (
              <span
                key={diff}
                className={cn("rounded px-2 py-0.5 text-xs capitalize", DIFFICULTY_STYLE[diff] ?? "bg-muted text-muted-foreground")}
              >
                {n} {diff}
              </span>
            ))}
          </div>

          {/* Topic coverage */}
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(topicCounts).map((t) => (
              <Badge key={t} variant="outline" className="text-xs">
                {t}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      {exam.questions.map((q) => (
        <Card key={q.number}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">
                {q.number}. {q.prompt}
              </p>
              <Badge variant="secondary" className="shrink-0">
                {q.marks} {q.marks === 1 ? "mark" : "marks"}
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
              <summary className="cursor-pointer font-medium select-none">
                Answer &amp; marking scheme
              </summary>
              <div className="mt-2 space-y-2">
                <p className="whitespace-pre-wrap">{q.answer}</p>
                <div className="border-t pt-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Marking scheme</p>
                  <p className="whitespace-pre-wrap text-muted-foreground">{q.marking_scheme}</p>
                </div>
              </div>
            </details>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
