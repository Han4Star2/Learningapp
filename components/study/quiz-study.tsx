"use client";

import { useState } from "react";
import { CheckCircle, XCircle, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Quiz, QuizQuestion } from "@/lib/ai/schemas";

type UserAnswer = string;
type AnswerMap = Record<number, UserAnswer>;
type ResultMap = Record<number, boolean>;

function isCorrect(q: QuizQuestion, answer: string): boolean {
  return answer.trim().toLowerCase() === q.answer.trim().toLowerCase();
}

function QuestionCard({
  q,
  index,
  answer,
  setAnswer,
  submitted,
}: {
  q: QuizQuestion;
  index: number;
  answer: string;
  setAnswer: (v: string) => void;
  submitted: boolean;
}) {
  const correct = submitted ? isCorrect(q, answer) : null;
  const hasOptions = q.options && q.options.length > 0;

  return (
    <Card className={cn(submitted && (correct ? "border-emerald-300" : "border-rose-300"))}>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <span className="shrink-0 font-semibold text-muted-foreground">{index + 1}.</span>
          <p className="font-medium">{q.prompt}</p>
          {q.question_type && (
            <Badge variant="outline" className="shrink-0 text-xs capitalize">
              {q.question_type.replace("_", " ")}
            </Badge>
          )}
        </div>

        {/* Options (MCQ / True-False) */}
        {hasOptions && !submitted && (
          <div className="grid gap-1.5 pl-5">
            {q.options!.map((opt, j) => (
              <button
                key={j}
                type="button"
                onClick={() => setAnswer(opt)}
                className={cn(
                  "rounded-md border px-3 py-2 text-left text-sm transition-colors",
                  answer === opt
                    ? "border-primary bg-primary/10 font-medium"
                    : "border-input hover:bg-accent"
                )}
              >
                {q.question_type !== "true_false" && (
                  <span className="mr-2 font-medium">{String.fromCharCode(65 + j)}.</span>
                )}
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Text input (short-answer / fill_blank) */}
        {!hasOptions && !submitted && (
          <div className="pl-5">
            <Input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Your answer…"
              className="max-w-sm"
            />
          </div>
        )}

        {/* Result display */}
        {submitted && (
          <div className="pl-5 space-y-2">
            <div className={cn("flex items-center gap-2 text-sm font-medium", correct ? "text-emerald-700" : "text-rose-700")}>
              {correct ? <CheckCircle className="size-4" /> : <XCircle className="size-4" />}
              {correct ? "Correct!" : `Incorrect — correct answer: ${q.answer}`}
            </div>
            {!correct && answer && (
              <p className="text-sm text-muted-foreground">Your answer: {answer || "(no answer)"}</p>
            )}
            {q.explanation && (
              <p className="text-sm text-muted-foreground italic">{q.explanation}</p>
            )}
          </div>
        )}

        <p className="pl-5 text-xs text-muted-foreground">{q.topic}</p>
      </CardContent>
    </Card>
  );
}

export function QuizStudy({ quiz }: { quiz: Quiz }) {
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [submitted, setSubmitted] = useState(false);

  function setAnswer(index: number, value: string) {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  }

  const results: ResultMap = submitted
    ? Object.fromEntries(
        quiz.questions.map((q, i) => [i, isCorrect(q, answers[i] ?? "")])
      )
    : {};

  const score = Object.values(results).filter(Boolean).length;
  const pct = Math.round((score / quiz.questions.length) * 100);

  if (submitted) {
    return (
      <div className="space-y-4">
        {/* Score card */}
        <Card className="border-2 border-primary/20">
          <CardContent className="p-6 text-center">
            <p className="text-4xl font-bold">{score}/{quiz.questions.length}</p>
            <p className="mt-1 text-muted-foreground">{pct}% correct</p>
            <p className="mt-2 text-sm">
              {pct >= 80 ? "Excellent work!" : pct >= 60 ? "Good effort — review the ones you missed." : "Keep revising — you'll get there!"}
            </p>
            <Button className="mt-4" onClick={() => { setAnswers({}); setSubmitted(false); }}>
              Try again
            </Button>
          </CardContent>
        </Card>

        {/* Review */}
        <h3 className="font-semibold">Review</h3>
        {quiz.questions.map((q, i) => (
          <QuestionCard
            key={i}
            q={q}
            index={i}
            answer={answers[i] ?? ""}
            setAnswer={() => {}}
            submitted={true}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <h2 className="text-lg font-semibold">{quiz.title}</h2>
          <p className="text-sm text-muted-foreground">{quiz.questions.length} questions</p>
        </CardContent>
      </Card>

      {quiz.questions.map((q, i) => (
        <QuestionCard
          key={i}
          q={q}
          index={i}
          answer={answers[i] ?? ""}
          setAnswer={(v) => setAnswer(i, v)}
          submitted={false}
        />
      ))}

      <div className="flex justify-end pt-2">
        <Button
          size="lg"
          onClick={() => setSubmitted(true)}
        >
          Submit answers
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
