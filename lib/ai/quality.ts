import type { Exam, Quiz, FlashcardSet } from "./schemas";

/**
 * Pre-save quality evaluation. Returns an error string if the generation
 * fails minimum quality requirements, or null if it passes.
 */

export function evaluateExamQuality(exam: Exam): string | null {
  if (exam.questions.length === 0) return "Exam has no questions.";

  const marksSum = exam.questions.reduce((s, q) => s + q.marks, 0);
  if (marksSum !== exam.total_marks) {
    return `Marks don't sum correctly: got ${marksSum}, expected ${exam.total_marks}.`;
  }

  for (const q of exam.questions) {
    if (q.marks < 1) return `Question ${q.number} has ${q.marks} marks — must be ≥1.`;
    if (!q.answer.trim()) return `Question ${q.number} is missing an answer.`;
    if (!q.marking_scheme.trim()) return `Question ${q.number} is missing a marking scheme.`;
    if (!q.prompt.trim()) return `Question ${q.number} has an empty prompt.`;
  }

  const topics = new Set(exam.questions.map((q) => q.topic.trim().toLowerCase()));
  if (topics.size === 1 && exam.questions.length >= 5) {
    return "All questions cover the same topic — expected broader topic coverage.";
  }

  return null;
}

export function evaluateQuizQuality(quiz: Quiz): string | null {
  if (quiz.questions.length === 0) return "Quiz has no questions.";

  for (const [i, q] of quiz.questions.entries()) {
    if (!q.prompt.trim()) return `Question ${i + 1} has an empty prompt.`;
    if (!q.answer.trim()) return `Question ${i + 1} is missing an answer.`;

    if (q.options !== null) {
      if (q.options.length < 2) {
        return `Question ${i + 1} has fewer than 2 options.`;
      }
      const lower = q.options.map((o) => o.trim().toLowerCase());
      const answerLower = q.answer.trim().toLowerCase();
      if (!lower.includes(answerLower) && !q.options.includes(q.answer)) {
        return `Question ${i + 1}: the answer "${q.answer}" is not among the options.`;
      }
    }
  }

  // Require at least minimal diversity — no more than 90% of questions identical type
  const types = quiz.questions.map((q) =>
    q.options ? "mc" : "open"
  );
  const mcCount = types.filter((t) => t === "mc").length;
  if (mcCount === quiz.questions.length && quiz.questions.length >= 6) {
    return "All questions are multiple-choice — expected a mix of question types.";
  }

  return null;
}

export function evaluateFlashcardQuality(set: FlashcardSet): string | null {
  if (set.cards.length === 0) return "Flashcard set has no cards.";

  for (const [i, card] of set.cards.entries()) {
    if (!card.front.trim()) return `Card ${i + 1} has an empty front.`;
    if (!card.back.trim()) return `Card ${i + 1} has an empty back.`;
    if (card.front.trim().toLowerCase() === card.back.trim().toLowerCase()) {
      return `Card ${i + 1}: front and back are identical.`;
    }
    if (card.front.length > 300) {
      return `Card ${i + 1}: front is too long (${card.front.length} chars, max 300).`;
    }
    if (card.back.length > 600) {
      return `Card ${i + 1}: back is too long (${card.back.length} chars, max 600).`;
    }
  }

  // Duplicate front detection (≥80% similar)
  const fronts = set.cards.map((c) => c.front.trim().toLowerCase());
  const unique = new Set(fronts);
  if (unique.size < fronts.length * 0.85) {
    return `Too many duplicate cards detected (${fronts.length - unique.size} duplicates).`;
  }

  return null;
}
