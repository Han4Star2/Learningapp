import { z } from "zod";

/**
 * Output contracts for AI generation. Used both to constrain the model
 * (structured outputs) and to narrow `content_json` when rendering.
 * Note: structured outputs require closed objects; optional fields are
 * modeled as nullable rather than absent.
 *
 * New optional fields use z.optional() so previously-stored content
 * (without those fields) still parses successfully.
 */

export const ExamSchema = z.object({
  title: z.string(),
  total_marks: z.number().int(),
  duration_minutes: z.number().int(),
  questions: z.array(
    z.object({
      number: z.number().int(),
      prompt: z.string(),
      marks: z.number().int(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      topic: z.string(),
      answer: z.string(),
      marking_scheme: z.string(),
    })
  ),
});
export type Exam = z.infer<typeof ExamSchema>;

export const QUIZ_QUESTION_TYPES = [
  "multiple_choice",
  "short_answer",
  "true_false",
  "fill_blank",
] as const;
export type QuizQuestionType = (typeof QUIZ_QUESTION_TYPES)[number];

export const QuizSchema = z.object({
  title: z.string(),
  questions: z.array(
    z.object({
      question_type: z.enum(QUIZ_QUESTION_TYPES).optional(),
      prompt: z.string(),
      options: z.array(z.string()).nullable(),
      answer: z.string(),
      explanation: z.string().optional(),
      topic: z.string(),
    })
  ),
});
export type Quiz = z.infer<typeof QuizSchema>;
export type QuizQuestion = Quiz["questions"][number];

export const FlashcardSetSchema = z.object({
  title: z.string(),
  cards: z.array(
    z.object({
      front: z.string(),
      back: z.string(),
      topic: z.string(),
      hint: z.string().optional(),
    })
  ),
});
export type FlashcardSet = z.infer<typeof FlashcardSetSchema>;
export type Flashcard = FlashcardSet["cards"][number];
