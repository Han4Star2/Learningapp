"use client";

import { useState } from "react";
import { CheckCircle, MinusCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Exam } from "@/lib/ai/schemas";

type SelfMark = "correct" | "partial" | "wrong";

const DIFFICULTY_STYLE: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  hard: "bg-rose-100 text-rose-800",
};

const MARK_CONFIG: Record<SelfMark, { label: string; icon: typeof CheckCircle; style: string; markFraction: number }> = {
  correct: {
    label: "Full marks",
    icon: CheckCircle,
    style: "border-emerald-300 bg-emerald-50 text-emerald-700",
    markFraction: 1,
  },
  partial: {
    label: "Partial",
    icon: MinusCircle,
    style: "border-amber-300 bg-amber-50 text-amber-700",
    markFraction: 0.5,
  },
  wrong: {
    label: "Missed",
    icon: XCircle,
    style: "border-rose-300 bg-rose-50 text-rose-700",
    markFraction: 0,
  },
};

export function ExamStudy({ exam }: { exam: Exam }) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [phase, setPhase] = useState<"answering" | "marking" | "done">("answering");
  const [selfMarks, setSelfMarks] = useState<Record<number, SelfMark>>({});

  function setAnswer(n: number, v: string) {
    setAnswers((prev) => ({ ...prev, [n]: v }));
  }

  function mark(n: number, m: SelfMark) {
    setSelfMarks((prev) => ({ ...prev, [n]: m }));
  }

  const earnedMarks = exam.questions.reduce((sum, q) => {
    const m = selfMarks[q.number];
    if (!m) return sum;
    return sum + Math.round(q.marks * MARK_CONFIG[m].markFraction);
  }, 0);

  const markedCount = Object.keys(selfMarks).length;
  const allMarked = markedCount === exam.questions.length;

  if (phase === "done") {
    const pct = Math.round((earnedMarks / exam.total_marks) * 100);
    return (
      <div className="space-y-4">
        <Card className="border-2 border-primary/20">
          <CardContent className="p-6 text-center">
            <p className="text-4xl font-bold">{earnedMarks}/{exam.total_marks}</p>
            <p className="mt-1 text-muted-foreground">{pct}%</p>
            <p className="mt-2 text-sm">
              {pct >= 70 ? "Great performance!" : pct >= 50 ? "Getting there — review the harder questions." : "More revision needed — revisit the key topics."}
            </p>
            <Button className="mt-4" onClick={() => { setAnswers({}); setSelfMarks({}); setPhase("answering"); }}>
              Retake exam
            </Button>
          </CardContent>
        </Card>

        {/* Full review */}
        <h3 className="font-semibold">Full review</h3>
        {exam.questions.map((q) => {
          const m = selfMarks[q.number];
          const earned = m ? Math.round(q.marks * MARK_CONFIG[m].markFraction) : 0;
          return (
            <Card key={q.number} className={cn("border", m ? MARK_CONFIG[m].style : "")}>
              <CardContent className="p-5 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{q.number}. {q.prompt}</p>
                  <Badge variant="secondary">{earned}/{q.marks}</Badge>
                </div>
                {answers[q.number] && (
                  <div className="rounded-md bg-white/60 p-2 text-sm">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Your answer</p>
                    <p className="whitespace-pre-wrap">{answers[q.number]}</p>
                  </div>
                )}
                <div className="rounded-md bg-muted/60 p-2 text-sm">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Model answer</p>
                  <p className="whitespace-pre-wrap">{q.answer}</p>
                  <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">{q.marking_scheme}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  if (phase === "marking") {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <h2 className="text-lg font-semibold">Self-marking</h2>
              <p className="text-sm text-muted-foreground">
                {markedCount}/{exam.questions.length} marked · {earnedMarks} marks so far
              </p>
            </div>
            <Button disabled={!allMarked} onClick={() => setPhase("done")}>
              See results
            </Button>
          </CardContent>
        </Card>

        {exam.questions.map((q) => {
          const m = selfMarks[q.number];
          return (
            <Card key={q.number} className={cn(m ? MARK_CONFIG[m].style : "")}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{q.number}. {q.prompt}</p>
                  <Badge variant="secondary">{q.marks} {q.marks === 1 ? "mark" : "marks"}</Badge>
                </div>

                {/* Student's answer */}
                <div className="rounded-md bg-white/60 p-3 text-sm">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Your answer</p>
                  <p className="whitespace-pre-wrap">{answers[q.number] || "(no answer)"}</p>
                </div>

                {/* Model answer */}
                <details className="rounded-md bg-muted/60 p-3 text-sm">
                  <summary className="cursor-pointer font-medium select-none">Model answer &amp; marking scheme</summary>
                  <p className="mt-2 whitespace-pre-wrap">{q.answer}</p>
                  <p className="mt-2 whitespace-pre-wrap text-muted-foreground text-xs">{q.marking_scheme}</p>
                </details>

                {/* Self-mark buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {(["correct", "partial", "wrong"] as SelfMark[]).map((opt) => {
                    const cfg = MARK_CONFIG[opt];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => mark(q.number, opt)}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-md border p-2 text-xs font-medium transition-colors",
                          m === opt ? cfg.style : "border-input hover:bg-accent"
                        )}
                      >
                        <Icon className="size-4" />
                        {cfg.label}
                        <span className="text-muted-foreground">
                          {Math.round(q.marks * cfg.markFraction)}/{q.marks}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // Answering phase
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <h2 className="text-lg font-semibold">{exam.title}</h2>
            <p className="text-sm text-muted-foreground">
              {exam.questions.length} questions · {exam.total_marks} marks · {exam.duration_minutes} min
            </p>
          </div>
          <Button onClick={() => setPhase("marking")}>
            Finish &amp; mark
          </Button>
        </CardContent>
      </Card>

      {exam.questions.map((q) => (
        <Card key={q.number}>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">{q.number}. {q.prompt}</p>
              <div className="flex shrink-0 gap-1.5">
                <span className={cn("rounded px-2 py-0.5 text-xs capitalize", DIFFICULTY_STYLE[q.difficulty] ?? "bg-muted text-muted-foreground")}>
                  {q.difficulty}
                </span>
                <Badge variant="secondary">{q.marks} {q.marks === 1 ? "mark" : "marks"}</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{q.topic}</p>
            <Textarea
              rows={4}
              placeholder="Write your answer here…"
              value={answers[q.number] ?? ""}
              onChange={(e) => setAnswer(q.number, e.target.value)}
            />
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end pt-2">
        <Button size="lg" onClick={() => setPhase("marking")}>
          Finish &amp; self-mark
        </Button>
      </div>
    </div>
  );
}
