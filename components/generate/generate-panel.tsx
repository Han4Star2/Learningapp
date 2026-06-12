"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  ListChecks,
  Layers,
  Loader2,
  Sparkles,
} from "lucide-react";
import { generateContent } from "@/actions/generate";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  AI_CONTENT_TYPES,
  type AIContentType,
  type Teacher,
} from "@/types/domain";

const META: Record<
  AIContentType,
  { title: string; blurb: string; icon: typeof ClipboardList }
> = {
  exam: {
    title: "Practice exam",
    blurb: "Full exam with marks, difficulty and marking schemes.",
    icon: ClipboardList,
  },
  quiz: {
    title: "Quiz",
    blurb: "Short questions for fast revision.",
    icon: ListChecks,
  },
  flashcards: {
    title: "Flashcards",
    blurb: "Front/back cards for active recall.",
    icon: Layers,
  },
};

type Difficulty = "easy" | "medium" | "hard" | "mixed";

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
  const [teacherId, setTeacherId] = useState("");
  const [count, setCount] = useState(initialType === "flashcards" ? 20 : 10);
  const [difficulty, setDifficulty] = useState<Difficulty>("mixed");
  const [totalMarks, setTotalMarks] = useState(50);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function selectType(t: AIContentType) {
    if (pending) return;
    setType(t);
    setCount(t === "flashcards" ? 20 : 10);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await generateContent({
        subjectId,
        type,
        teacherId: teacherId || null,
        count,
        difficulty,
        totalMarks: type === "exam" ? totalMarks : undefined,
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
      {/* Type selector — disabled while generating */}
      <div className="grid gap-3 sm:grid-cols-3">
        {AI_CONTENT_TYPES.map((t) => {
          const Icon = META[t].icon;
          const active = type === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => selectType(t)}
              disabled={pending}
              className={cn(
                "rounded-lg border p-4 text-left transition-colors disabled:pointer-events-none disabled:opacity-50",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-card hover:bg-accent"
              )}
            >
              <Icon className="size-5" />
              <p className="mt-2 font-medium">{META[t].title}</p>
              <p
                className={cn(
                  "mt-1 text-xs",
                  active ? "text-primary-foreground/80" : "text-muted-foreground"
                )}
              >
                {META[t].blurb}
              </p>
            </button>
          );
        })}
      </div>

      {/* Options */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                <Label htmlFor="gen-teacher">Teacher style</Label>
                <Select
                  id="gen-teacher"
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  disabled={pending}
                >
                  <option value="">No specific teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gen-count">
                  {type === "flashcards" ? "Cards" : "Questions"}
                </Label>
                <Input
                  id="gen-count"
                  type="number"
                  min={1}
                  max={50}
                  value={count}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    setCount(Number.isFinite(n) ? n : count);
                  }}
                  disabled={pending}
                />
              </div>
              {type === "exam" && (
                <div className="space-y-1.5">
                  <Label htmlFor="gen-marks">Total marks</Label>
                  <Input
                    id="gen-marks"
                    type="number"
                    min={5}
                    max={500}
                    value={totalMarks}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      setTotalMarks(Number.isFinite(n) ? n : totalMarks);
                    }}
                    disabled={pending}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="gen-difficulty">Difficulty</Label>
                <Select
                  id="gen-difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  disabled={pending}
                >
                  <option value="mixed">Mixed</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </Select>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles />
                    Generate {META[type].title.toLowerCase()}
                  </>
                )}
              </Button>
              {pending && (
                <p className="text-sm text-muted-foreground">
                  Reading your documents and building the{" "}
                  {META[type].title.toLowerCase()} — this usually takes
                  30–60 seconds.
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
