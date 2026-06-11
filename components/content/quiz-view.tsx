"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import type { Quiz } from "@/lib/ai/schemas";

export function QuizView({ quiz }: { quiz: Quiz }) {
  const [showAnswers, setShowAnswers] = useState(false);

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{quiz.title}</h2>
        <Button variant="ghost" onClick={() => setShowAnswers((v) => !v)}>
          {showAnswers ? "Hide answers" : "Show answers"}
        </Button>
      </Card>

      {quiz.questions.map((q, i) => (
        <Card key={i}>
          <p className="font-medium">
            {i + 1}. {q.prompt}
          </p>
          {q.options && (
            <ul className="mt-2 space-y-1 text-sm">
              {q.options.map((opt, j) => (
                <li
                  key={j}
                  className={
                    showAnswers && opt === q.answer
                      ? "rounded bg-green-50 px-2 py-1 font-medium text-green-800"
                      : "px-2 py-1"
                  }
                >
                  {String.fromCharCode(65 + j)}. {opt}
                </li>
              ))}
            </ul>
          )}
          {showAnswers && (
            <p className="mt-2 rounded-md bg-gray-50 p-2 text-sm">
              <span className="font-medium">Answer:</span> {q.answer}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-400">{q.topic}</p>
        </Card>
      ))}
    </div>
  );
}
