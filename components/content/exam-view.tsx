import { Card } from "@/components/ui";
import type { Exam } from "@/lib/ai/schemas";

const DIFFICULTY_STYLE: Record<string, string> = {
  easy: "bg-green-100 text-green-800",
  medium: "bg-amber-100 text-amber-800",
  hard: "bg-red-100 text-red-800",
};

export function ExamView({ exam }: { exam: Exam }) {
  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{exam.title}</h2>
        <p className="text-sm text-gray-500">
          {exam.total_marks} marks · {exam.duration_minutes} minutes ·{" "}
          {exam.questions.length} questions
        </p>
      </Card>

      {exam.questions.map((q) => (
        <Card key={q.number}>
          <div className="flex items-start justify-between gap-3">
            <p className="font-medium">
              {q.number}. {q.prompt}
            </p>
            <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
              {q.marks} marks
            </span>
          </div>
          <div className="mt-2 flex gap-2 text-xs">
            <span className={`rounded px-2 py-0.5 ${DIFFICULTY_STYLE[q.difficulty] ?? ""}`}>
              {q.difficulty}
            </span>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">
              {q.topic}
            </span>
          </div>
          <details className="mt-3 rounded-md bg-gray-50 p-3 text-sm">
            <summary className="cursor-pointer font-medium text-gray-700">
              Answer & marking scheme
            </summary>
            <p className="mt-2 whitespace-pre-wrap">{q.answer}</p>
            <p className="mt-2 whitespace-pre-wrap text-gray-600">
              <span className="font-medium">Marking:</span> {q.marking_scheme}
            </p>
          </details>
        </Card>
      ))}
    </div>
  );
}
