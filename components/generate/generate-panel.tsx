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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { AI_CONTENT_TYPES, type AIContentType, type Teacher } from "@/types/domain";

const META: Record<AIContentType, { title: string; blurb: string; icon: typeof ClipboardList }> = {
  exam: {
    title: "Practice exam",
    blurb: "Full exam with marks, difficulty distribution, and marking schemes.",
    icon: ClipboardList,
  },
  quiz: {
    title: "Quiz",
    blurb: "Mix of MCQ, short-answer, true/false and fill-in-the-blank questions.",
    icon: ListChecks,
  },
  flashcards: {
    title: "Flashcards",
    blurb: "Active recall cards for spaced repetition studying.",
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
    <div className="space-y-5">
      {/* Type selector */}
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
                "rounded-xl border p-4 text-left transition-all duration-300 hover:scale-105 hover:-translate-y-1",
                "disabled:pointer-events-none disabled:opacity-50",
                active
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30 shadow-md"
                  : "border-border bg-card hover:bg-accent/50 hover:border-border/80 hover:shadow-md"
              )}
            >
              <div className={cn(
                "flex size-8 items-center justify-center rounded-lg",
                active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                <Icon className="size-4" />
              </div>
              <p className={cn("mt-3 text-sm font-semibold", active ? "text-foreground" : "text-foreground/80")}>
                {META[t].title}
              </p>
              <p className={cn("mt-1 text-xs leading-relaxed", active ? "text-muted-foreground" : "text-muted-foreground/70")}>
                {META[t].blurb}
              </p>
            </button>
          );
        })}
      </div>

      {/* Options form */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Options</CardTitle>
          <CardDescription>Configure the {META[type].title.toLowerCase()} generation.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
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
                    <option key={t.id} value={t.id}>{t.name}</option>
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

            {error && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={pending} size="lg">
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
                  Reading documents and building your {META[type].title.toLowerCase()} — 30–60 seconds.
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
