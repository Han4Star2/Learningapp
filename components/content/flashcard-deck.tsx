"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import type { FlashcardSet } from "@/lib/ai/schemas";

export function FlashcardDeck({ set }: { set: FlashcardSet }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = set.cards[index];
  if (!card) return <p className="text-sm text-gray-500">This set has no cards.</p>;

  function go(delta: number) {
    setFlipped(false);
    setIndex((i) => Math.min(Math.max(i + delta, 0), set.cards.length - 1));
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{set.title}</h2>
        <p className="text-sm text-gray-500">
          {index + 1} / {set.cards.length}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="block w-full"
        aria-label={flipped ? "Show front" : "Show back"}
      >
        <Card className="flex min-h-56 flex-col items-center justify-center p-8 text-center transition hover:border-gray-400">
          <p className="text-xs uppercase tracking-wide text-gray-400">
            {flipped ? "Back" : "Front"} — tap to flip
          </p>
          <p className="mt-3 whitespace-pre-wrap text-lg">
            {flipped ? card.back : card.front}
          </p>
          <p className="mt-4 text-xs text-gray-400">{card.topic}</p>
        </Card>
      </button>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => go(-1)} disabled={index === 0}>
          ← Previous
        </Button>
        <Button
          variant="ghost"
          onClick={() => go(1)}
          disabled={index === set.cards.length - 1}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
