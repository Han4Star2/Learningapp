import { z } from "zod";
import { getOpenAIClient, CHAT_MODEL } from "@/lib/openai/client";
import { buildFrame } from "./context";
import { EXAM_SYSTEM, QUIZ_SYSTEM, FLASHCARDS_SYSTEM } from "./prompts";
import { ExamSchema, QuizSchema, FlashcardSetSchema } from "./schemas";
import type { AIContentType, StudyDocument } from "@/types/domain";

export type GenerateOptions = {
  count: number;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  totalMarks?: number;
  topics?: string; // optional comma-separated topic list from the user
};

const CONFIG = {
  exam: {
    system: EXAM_SYSTEM,
    schema: ExamSchema,
    schemaName: "exam",
    task: (o: GenerateOptions) => {
      const base = `Generate an exam of ${o.count} questions totalling ${o.totalMarks ?? o.count * 5} marks at ${o.difficulty} overall difficulty. Tag each question with its topic and provide a concise marking scheme.`;
      return o.topics?.trim()
        ? `${base}\n\nTOPICS TO COVER: The exam MUST include questions on the following topics (distribute marks proportionally across them): ${o.topics.trim()}`
        : base;
    },
  },
  quiz: {
    system: QUIZ_SYSTEM,
    schema: QuizSchema,
    schemaName: "quiz",
    task: (o: GenerateOptions) => {
      const base = `Generate a ${o.count}-question revision quiz at ${o.difficulty} difficulty.`;
      return o.topics?.trim()
        ? `${base}\n\nTOPICS TO COVER: Focus the questions on these topics: ${o.topics.trim()}`
        : base;
    },
  },
  flashcards: {
    system: FLASHCARDS_SYSTEM,
    schema: FlashcardSetSchema,
    schemaName: "flashcard_set",
    task: (o: GenerateOptions) => {
      const base = `Generate ${o.count} flashcards covering the key recallable facts, definitions and concepts.`;
      return o.topics?.trim()
        ? `${base}\n\nTOPICS TO COVER: Focus the cards on these topics: ${o.topics.trim()}`
        : base;
    },
  },
} as const;

async function callOnce(args: {
  type: AIContentType;
  subjectName: string;
  contentDocs: StudyDocument[];
  styleDocs: StudyDocument[];
  options: GenerateOptions;
}): Promise<{ title: string; json: unknown }> {
  const { type, subjectName, contentDocs, styleDocs, options } = args;
  const config = CONFIG[type];
  const client = getOpenAIClient();

  const userMessage = buildFrame({
    subjectName,
    contentDocs,
    styleDocs,
    task: config.task(options),
  });

  // Zod v4 built-in JSON schema serializer — no extra package needed
  const jsonSchema = z.toJSONSchema(config.schema as z.ZodType);

  const completion = await client.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.7,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: config.schemaName,
        schema: jsonSchema as Record<string, unknown>,
        strict: true,
      },
    },
    messages: [
      { role: "system", content: config.system },
      { role: "user", content: userMessage },
    ],
  });

  const choice = completion.choices[0];

  if (choice.finish_reason === "length") {
    throw new Error(
      "The result was too long and got cut off. Try fewer questions/cards, or split the material across smaller generations."
    );
  }
  if (choice.finish_reason === "content_filter") {
    throw new Error("The request was declined by the content filter. Try different source material.");
  }

  const raw = choice.message.content;
  if (!raw) throw new Error("The model returned an empty response.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("The model did not return valid structured output.");
  }

  const validated = config.schema.parse(parsed);
  return { title: (validated as { title: string }).title, json: validated };
}

/**
 * Generates structured study content (exam / quiz / flashcards) via OpenAI.
 * Attempts once, retries once on structured-output failure only.
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
    const isStructureError =
      firstErr instanceof Error &&
      firstErr.message === "The model did not return valid structured output.";
    if (!isStructureError) throw firstErr;

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
