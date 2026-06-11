import { z } from "zod";

/**
 * Output contracts for AI generation. Used both to constrain the model
 * (structured outputs) and to narrow `content_json` when rendering.
 * Note: structured outputs require closed objects; optional fields are
 * modeled as nullable rather than absent.
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

export const QuizSchema = z.object({
  title: z.string(),
  questions: z.array(
    z.object({
      prompt: z.string(),
      options: z.array(z.string()).nullable(), // null = short-answer
      answer: z.string(),
      topic: z.string(),
    })
  ),
});
export type Quiz = z.infer<typeof QuizSchema>;

export const FlashcardSetSchema = z.object({
  title: z.string(),
  cards: z.array(
    z.object({
      front: z.string(),
      back: z.string(),
      topic: z.string(),
    })
  ),
});
export type FlashcardSet = z.infer<typeof FlashcardSetSchema>;
