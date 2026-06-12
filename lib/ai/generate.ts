import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient, MODEL } from "./client";
import { buildFrame } from "./context";
import { EXAM_SYSTEM, QUIZ_SYSTEM, FLASHCARDS_SYSTEM } from "./prompts";
import { ExamSchema, QuizSchema, FlashcardSetSchema } from "./schemas";
import type { AIContentType, StudyDocument } from "@/types/domain";

export type GenerateOptions = {
  count: number; // questions or cards
  difficulty: "easy" | "medium" | "hard" | "mixed";
  totalMarks?: number; // exam only
};

const CONFIG = {
  exam: {
    system: EXAM_SYSTEM,
    schema: ExamSchema,
    task: (o: GenerateOptions) =>
      `Generate an exam of ${o.count} questions totalling ${o.totalMarks ?? o.count * 5} marks at ${o.difficulty} overall difficulty. Tag each question with its topic and provide a concise marking scheme.`,
  },
  quiz: {
    system: QUIZ_SYSTEM,
    schema: QuizSchema,
    task: (o: GenerateOptions) =>
      `Generate a ${o.count}-question revision quiz at ${o.difficulty} difficulty.`,
  },
  flashcards: {
    system: FLASHCARDS_SYSTEM,
    schema: FlashcardSetSchema,
    task: (o: GenerateOptions) =>
      `Generate ${o.count} flashcards covering the key recallable facts, definitions and concepts.`,
  },
} as const;

/**
 * Calls the API once and returns the parsed output, or throws with an
 * actionable message if the response is empty/truncated/refused.
 */
async function callOnce(args: {
  type: AIContentType;
  subjectName: string;
  contentDocs: StudyDocument[];
  styleDocs: StudyDocument[];
  options: GenerateOptions;
}): Promise<{ title: string; json: unknown }> {
  const { type, subjectName, contentDocs, styleDocs, options } = args;
  const config = CONFIG[type];

  const client = getAnthropicClient();
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: zodOutputFormat(config.schema) },
    system: config.system,
    messages: [
      {
        role: "user",
        content: buildFrame({
          subjectName,
          contentDocs,
          styleDocs,
          task: config.task(options),
        }),
      },
    ],
  });

  if (response.stop_reason === "max_tokens") {
    throw new Error(
      "The result was too long and got cut off. Try fewer questions/cards, or split the material across smaller generations."
    );
  }
  if (response.stop_reason === "refusal") {
    throw new Error("The request was declined. Try different source material.");
  }

  const parsed = response.parsed_output;
  if (!parsed) {
    throw new Error("The model did not return valid structured output.");
  }
  return { title: parsed.title, json: parsed };
}

/**
 * Generates structured study content (exam / quiz / flashcards).
 *
 * Strategy: attempt once; on structured-output failure retry a single time
 * before propagating a readable error to the UI. All other errors (network,
 * auth, truncation, refusal) propagate immediately.
 */
export async function generateStructured(args: {
  type: AIContentType;
  subjectName: string;
  contentDocs: StudyDocument[];
  styleDocs: StudyDocument[];
  options: GenerateOptions;
}): Promise<{ title: string; json: unknown }> {
  try {
    return await callOnce(args);
  } catch (firstErr) {
    // Only retry for "no structured output" — not for truncation/refusal/network.
    const isStructureError =
      firstErr instanceof Error &&
      firstErr.message === "The model did not return valid structured output.";
    if (!isStructureError) throw firstErr;

    // Single retry — give the model a second chance with the same prompt.
    try {
      return await callOnce(args);
    } catch (secondErr) {
      throw new Error(
        secondErr instanceof Error && secondErr.message !== firstErr.message
          ? secondErr.message
          : "The model failed to produce structured output after two attempts. Try reducing the question count or simplifying the document content."
      );
    }
  }
}
