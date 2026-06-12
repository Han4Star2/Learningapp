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
 * Synchronous generation (MVP): merge CONTENT + STYLE layers into one
 * structured prompt and get schema-guaranteed JSON back.
 */
export async function generateStructured(args: {
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
    // `medium` effort keeps thinking-token spend (and latency) in check so a
    // bounded generation fits under the serverless function limit and leaves
    // room in max_tokens for the structured output. `format` guarantees JSON.
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

  // Surface the actual reason when parsing yields nothing, so the UI shows
  // something actionable instead of a generic failure.
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
