"use client";

import { useState, useMemo } from "react";
import { CheckCircle, RefreshCcw, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FlashcardSet } from "@/lib/ai/schemas";

export function FlashcardStudy({ set }: { set: FlashcardSet }) {
  // queue: indices of cards still to review (in order)
  const [queue, setQueue] = useState<number[]>(() =>
    set.cards.map((_, i) => i)
  );
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const currentIndex = queue[0];
  const card = currentIndex !== undefined ? set.cards[currentIndex] : undefined;
  const total = set.cards.length;
  const doneCount = known.size;
  const pct = Math.round((doneCount / total) * 100);

  function markKnown() {
    setKnown((prev) => new Set([...prev, currentIndex!]));
    setQueue((prev) => prev.slice(1));
    setFlipped(false);
    setShowHint(false);
  }

  function markAgain() {
    // Move to end of queue
    setQueue((prev) => [...prev.slice(1), prev[0]]);
    setFlipped(false);
    setShowHint(false);
  }

  function restart(onlyUnknown = false) {
    const remaining = set.cards
      .map((_, i) => i)
      .filter((i) => !onlyUnknown || !known.has(i));
    setQueue(remaining);
    if (!onlyUnknown) setKnown(new Set());
    setFlipped(false);
    setShowHint(false);
  }

  if (!card) {
    return (
      <div className="mx-auto max-w-xl space-y-4 text-center">
        <Card className="border-2 border-emerald-200">
          <CardContent className="p-8">
            <CheckCircle className="mx-auto size-12 text-emerald-500 mb-3" />
            <p className="text-2xl font-bold">{doneCount}/{total} known</p>
            <p className="mt-1 text-muted-foreground">
              {pct === 100 ? "You know all of them!" : `${pct}% complete`}
            </p>
            {doneCount < total && (
              <p className="mt-2 text-sm text-muted-foreground">
                {total - doneCount} card{total - doneCount !== 1 ? "s" : ""} still need practice.
              </p>
            )}
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button onClick={() => restart(false)}>
                <RotateCcw className="size-4" />
                Restart from scratch
              </Button>
              {total - doneCount > 0 && (
                <Button variant="outline" onClick={() => restart(true)}>
                  <RefreshCcw className="size-4" />
                  Review {total - doneCount} remaining
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{set.title}</h2>
        <span className="text-sm text-muted-foreground">
          {doneCount} known · {queue.length} left
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Card */}
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="block w-full"
        aria-label={flipped ? "Show front" : "Show back"}
      >
        <Card className={cn("transition-shadow hover:shadow-md", flipped && "border-primary/30")}>
          <CardContent className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
            <Badge variant={flipped ? "default" : "secondary"} className="mb-3 text-xs uppercase tracking-wide">
              {flipped ? "Back" : "Front"} — tap to flip
            </Badge>
            <p className="whitespace-pre-wrap text-lg">
              {flipped ? card.back : card.front}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">{card.topic}</p>
          </CardContent>
        </Card>
      </button>

      {/* Hint */}
      {card.hint && !flipped && (
        <div className="text-center">
          {showHint ? (
            <p className="text-sm text-muted-foreground italic">💡 {card.hint}</p>
          ) : (
            <button
              type="button"
              onClick={() => setShowHint(true)}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              Show hint
            </button>
          )}
        </div>
      )}

      {/* Actions — only show after flipping */}
      {flipped && (
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="border-rose-200 text-rose-700 hover:bg-rose-50"
            onClick={markAgain}
          >
            <RefreshCcw className="size-4" />
            Study again
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={markKnown}
          >
            <CheckCircle className="size-4" />
            Got it!
          </Button>
        </div>
      )}

      {!flipped && (
        <p className="text-center text-xs text-muted-foreground">
          Flip the card before marking
        </p>
      )}
    </div>
  );
}
