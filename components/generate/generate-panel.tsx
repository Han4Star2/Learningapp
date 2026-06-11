"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateContent } from "@/actions/generate";
import { clsx } from "@/components/clsx";
import { Button, Card, Input } from "@/components/ui";
import {
  AI_CONTENT_TYPES,
  type AIContentType,
  type Teacher,
} from "@/types/domain";

const LABELS: Record<AIContentType, { title: string; blurb: string }> = {
  exam: {
    title: "Practice exam",
    blurb: "Full exam with marks, difficulty and marking schemes — in your teacher's style.",
  },
  quiz: {
    title: "Quiz",
    blurb: "Short questions for fast revision: multiple-choice and short-answer.",
  },
  flashcards: {
    title: "Flashcards",
    blurb: "Front/back cards optimised for active recall.",
  },
};

export function GeneratePanel({
  subjectId,
  teachers,
  initialType = "exam",
}: {
  subjectId: string;
  teachers: Teacher[];
  initialType?: AIContentType;
}) {
  const router = useRouter();
  const [type, setType] = useState<AIContentType>(initialType);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const data = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await generateContent({
        subjectId,
        type,
        teacherId: String(data.get("teacher_id") ?? "") || null,
        count: Number(data.get("count") ?? 10),
        difficulty: (String(data.get("difficulty")) || "mixed") as
          | "easy"
          | "medium"
          | "hard"
          | "mixed",
        totalMarks:
          type === "exam" ? Number(data.get("total_marks") ?? 50) : undefined,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.push(`/subjects/${subjectId}/library/${result.id}`);
    });
  }

  return (
    <div className="space-y-4">
      {/* Type tabs */}
      <div className="grid gap-3 sm:grid-cols-3">
        {AI_CONTENT_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={clsx(
              "rounded-lg border p-4 text-left transition",
              type === t
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white hover:border-gray-400"
            )}
          >
            <p className="font-medium">{LABELS[t].title}</p>
            <p
              className={clsx(
                "mt-1 text-xs",
                type === t ? "text-gray-300" : "text-gray-500"
              )}
            >
              {LABELS[t].blurb}
            </p>
          </button>
        ))}
      </div>

      {/* Options */}
      <Card>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <div className="w-52">
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Teacher style (optional)
              </label>
              <select
                name="teacher_id"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                defaultValue=""
              >
                <option value="">No specific teacher</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-32">
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {type === "flashcards" ? "Cards" : "Questions"}
              </label>
              <Input
                name="count"
                type="number"
                min={1}
                max={50}
                defaultValue={type === "flashcards" ? 20 : 10}
              />
            </div>
            {type === "exam" && (
              <div className="w-32">
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Total marks
                </label>
                <Input name="total_marks" type="number" min={5} max={500} defaultValue={50} />
              </div>
            )}
            <div className="w-36">
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Difficulty
              </label>
              <select
                name="difficulty"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                defaultValue="mixed"
              >
                <option value="mixed">Mixed</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Generating…" : `Generate ${LABELS[type].title.toLowerCase()}`}
            </Button>
            {pending && (
              <p className="text-sm text-gray-500">
                The AI is reading your documents — this can take a minute.
              </p>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
