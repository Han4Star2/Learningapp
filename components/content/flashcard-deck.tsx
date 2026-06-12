"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { FlashcardSet } from "@/lib/ai/schemas";

export function FlashcardDeck({ set }: { set: FlashcardSet }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = set.cards[index];
  if (!card)
    return <p className="text-sm text-muted-foreground">This set has no cards.</p>;

  function go(delta: number) {
    setFlipped(false);
    setIndex((i) => Math.min(Math.max(i + delta, 0), set.cards.length - 1));
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{set.title}</h2>
        <p className="text-sm text-muted-foreground">
          {index + 1} / {set.cards.length}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="block w-full"
        aria-label={flipped ? "Show front" : "Show back"}
      >
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {flipped ? "Back" : "Front"} — tap to flip
            </p>
            <p className="mt-3 whitespace-pre-wrap text-lg">
              {flipped ? card.back : card.front}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">{card.topic}</p>
          </CardContent>
        </Card>
      </button>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => go(-1)} disabled={index === 0}>
          ← Previous
        </Button>
        <Button
          variant="outline"
          onClick={() => go(1)}
          disabled={index === set.cards.length - 1}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
