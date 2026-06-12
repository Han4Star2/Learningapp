"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Quiz } from "@/lib/ai/schemas";

const TYPE_LABEL: Record<string, string> = {
  multiple_choice: "MCQ",
  short_answer: "Short answer",
  true_false: "True / False",
  fill_blank: "Fill in the blank",
};

export function QuizView({ quiz }: { quiz: Quiz }) {
  const [showAnswers, setShowAnswers] = useState(false);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-2 p-5">
          <h2 className="text-lg font-semibold">{quiz.title}</h2>
          <Button variant="outline" size="sm" onClick={() => setShowAnswers((v) => !v)}>
            {showAnswers ? "Hide answers" : "Show answers"}
          </Button>
        </CardContent>
      </Card>

      {quiz.questions.map((q, i) => {
        const typeLabel = q.question_type ? TYPE_LABEL[q.question_type] : null;
        return (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">
                  {i + 1}. {q.prompt}
                </p>
                {typeLabel && (
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {typeLabel}
                  </Badge>
                )}
              </div>

              {q.options && (
                <ul className="mt-2 space-y-1 text-sm">
                  {q.options.map((opt, j) => (
                    <li
                      key={j}
                      className={cn(
                        "rounded px-2 py-1",
                        showAnswers && opt === q.answer
                          ? "bg-emerald-50 font-medium text-emerald-800"
                          : ""
                      )}
                    >
                      {q.question_type !== "true_false"
                        ? `${String.fromCharCode(65 + j)}. `
                        : ""}
                      {opt}
                    </li>
                  ))}
                </ul>
              )}

              {showAnswers && (
                <div className="mt-2 space-y-1 rounded-md bg-muted/60 p-2 text-sm">
                  <p>
                    <span className="font-medium">Answer:</span> {q.answer}
                  </p>
                  {q.explanation && (
                    <p className="text-muted-foreground">{q.explanation}</p>
                  )}
                </div>
              )}

              <p className="mt-2 text-xs text-muted-foreground">{q.topic}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
