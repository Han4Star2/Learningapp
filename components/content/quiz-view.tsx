"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Quiz } from "@/lib/ai/schemas";

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

      {quiz.questions.map((q, i) => (
        <Card key={i}>
          <CardContent className="p-5">
            <p className="font-medium">
              {i + 1}. {q.prompt}
            </p>
            {q.options && (
              <ul className="mt-2 space-y-1 text-sm">
                {q.options.map((opt, j) => (
                  <li
                    key={j}
                    className={cn(
                      "px-2 py-1",
                      showAnswers && opt === q.answer &&
                        "rounded bg-emerald-50 font-medium text-emerald-800"
                    )}
                  >
                    {String.fromCharCode(65 + j)}. {opt}
                  </li>
                ))}
              </ul>
            )}
            {showAnswers && (
              <p className="mt-2 rounded-md bg-muted/60 p-2 text-sm">
                <span className="font-medium">Answer:</span> {q.answer}
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">{q.topic}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
