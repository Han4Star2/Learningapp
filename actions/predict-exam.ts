"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getOpenAIClient, CHAT_MODEL } from "@/lib/openai/client";

// ── I/O schemas ──────────────────────────────────────────────────────────────

const PredictionSchema = z.object({
  predicted_questions: z.array(
    z.object({
      question: z.string(),
      topic: z.string(),
      likely_marks: z.number().int(),
      confidence: z.enum(["high", "medium", "low"]),
      reasoning: z.string(),
    })
  ),
  likely_topics: z.array(
    z.object({
      topic: z.string(),
      weight: z.number(), // 0–1, proportion of exam expected on this topic
      evidence: z.string(),
    })
  ),
  confidence_score: z.number(), // 0–100 overall prediction confidence
  reasoning_summary: z.string(),
});

export type ExamPrediction = z.infer<typeof PredictionSchema>;

export type PredictExamInput = {
  subjectId: string;
  teacherId: string;
  topicOverride?: string; // comma-separated; disables history analysis when set
  examDate?: string;      // ISO date string — used for recency reasoning
};

// ── JSON schema for OpenAI structured output ─────────────────────────────────

const RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    predicted_questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question:      { type: "string" },
          topic:         { type: "string" },
          likely_marks:  { type: "integer" },
          confidence:    { type: "string", enum: ["high", "medium", "low"] },
          reasoning:     { type: "string" },
        },
        required: ["question", "topic", "likely_marks", "confidence", "reasoning"],
        additionalProperties: false,
      },
    },
    likely_topics: {
      type: "array",
      items: {
        type: "object",
        properties: {
          topic:    { type: "string" },
          weight:   { type: "number" },
          evidence: { type: "string" },
        },
        required: ["topic", "weight", "evidence"],
        additionalProperties: false,
      },
    },
    confidence_score:   { type: "integer" },
    reasoning_summary:  { type: "string" },
  },
  required: [
    "predicted_questions",
    "likely_topics",
    "confidence_score",
    "reasoning_summary",
  ],
  additionalProperties: false,
} as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

const CHAR_LIMIT = 8_000;

function truncate(text: string): string {
  return text.length > CHAR_LIMIT
    ? text.slice(0, CHAR_LIMIT) + "\n[…truncated]"
    : text;
}

function buildSystemPrompt(useHistory: boolean, examDate?: string): string {
  const dateHint = examDate
    ? `The upcoming exam is on ${examDate}. Use this for recency weighting — topics tested very recently are less likely to appear again.`
    : "";

  if (!useHistory) {
    return `You are an expert exam prediction assistant. The student has specified exact topics to focus on — ignore any historical exam pattern analysis and base all predictions solely on those topics and the subject content provided. Produce realistic exam questions the teacher might ask on those topics.${dateHint ? `\n\n${dateHint}` : ""}`;
  }

  return `You are an expert exam prediction assistant. Your job is to predict what is most likely to appear in the next exam by:

1. TEACHER PATTERN ANALYSIS — Study the teacher's past exams: question styles, mark distributions, favourite topics, phrasing patterns, section structures. Weight recent exams more heavily than older ones.
2. TOPIC FREQUENCY — Identify which topics the teacher tests often vs. rarely. Topics not tested recently are more likely to reappear.
3. COVERAGE GAPS — Cross-reference the subject content with what has already been tested; untested material is high-probability.
4. CONFIDENCE SCORING — Rate each prediction by how strongly the evidence supports it.

Be analytical and specific. Provide concrete predicted questions (not vague topics).${dateHint ? `\n\n${dateHint}` : ""}`;
}

// ── Server Action ─────────────────────────────────────────────────────────────

export async function predictExam(
  input: PredictExamInput
): Promise<ExamPrediction | { error: string }> {
  if (!input.subjectId) return { error: "Subject ID is required." };
  if (!input.teacherId) return { error: "Teacher ID is required." };

  const { supabase } = await requireUser();
  const useTopicOverride = Boolean(input.topicOverride?.trim());

  // ── Fetch data ─────────────────────────────────────────────────────────────
  const [
    { data: subjectRow },
    { data: teacherRow },
    { data: pastExamRows },
    { data: subjectDocRows },
  ] = await Promise.all([
    supabase.from("subjects").select("name").eq("id", input.subjectId).single(),
    supabase.from("teachers").select("name").eq("id", input.teacherId).single(),
    // Past exams tagged to this teacher — the pattern source
    supabase
      .from("documents")
      .select("title, content, created_at")
      .eq("teacher_id", input.teacherId)
      .eq("type", "exam")
      .order("created_at", { ascending: false })
      .limit(10),
    // Subject content docs — the "what could be tested" source
    supabase
      .from("documents")
      .select("title, content, created_at")
      .eq("subject_id", input.subjectId)
      .order("created_at", { ascending: true })
      .limit(15),
  ]);

  if (!subjectRow) return { error: "Subject not found." };
  if (!teacherRow) return { error: "Teacher not found." };

  const pastExams = (pastExamRows ?? []).filter((d) => d.content?.trim());
  const subjectDocs = (subjectDocRows ?? []).filter((d) => d.content?.trim());

  if (!useTopicOverride && pastExams.length === 0) {
    return {
      error:
        "No past exams found for this teacher. Upload past exam documents tagged to this teacher, or provide a topic override.",
    };
  }
  if (subjectDocs.length === 0 && !useTopicOverride) {
    return {
      error: "No subject documents found. Add content documents to this subject first.",
    };
  }

  // ── Build user message ────────────────────────────────────────────────────
  const parts: string[] = [
    `# SUBJECT: ${subjectRow.name}`,
    `# TEACHER: ${teacherRow.name}`,
  ];

  if (useTopicOverride) {
    parts.push(
      `# TOPIC OVERRIDE (use ONLY these topics for predictions)\n${input.topicOverride!.trim()}`
    );
  }

  if (subjectDocs.length > 0 && !useTopicOverride) {
    parts.push(
      "# SUBJECT CONTENT (all testable material)\n" +
        subjectDocs
          .map((d) => `## ${d.title}\n${truncate(d.content!)}`)
          .join("\n\n")
    );
  }

  if (pastExams.length > 0) {
    parts.push(
      `# PAST EXAMS BY ${teacherRow.name.toUpperCase()} (analyse patterns)\n` +
        pastExams
          .map((e, i) => {
            const date = new Date(e.created_at).toLocaleDateString("en-GB", {
              year: "numeric",
              month: "short",
            });
            return `## Past Exam ${i + 1} (${date})\n${truncate(e.content!)}`;
          })
          .join("\n\n")
    );
  }

  if (input.examDate) {
    parts.push(`# UPCOMING EXAM DATE: ${input.examDate}`);
  }

  const userMessage = parts.join("\n\n");

  // ── Call OpenAI ───────────────────────────────────────────────────────────
  let client;
  try {
    client = getOpenAIClient();
  } catch {
    return { error: "AI service is not configured." };
  }

  let raw: string | null;
  try {
    const completion = await client.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.4,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "exam_prediction",
          strict: true,
          schema: RESPONSE_JSON_SCHEMA,
        },
      },
      messages: [
        { role: "system", content: buildSystemPrompt(useTopicOverride === false, input.examDate) },
        { role: "user", content: userMessage },
      ],
    });

    raw = completion.choices[0]?.message?.content ?? null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("API key"))    return { error: "AI service authentication failed." };
    if (msg.includes("rate limit")) return { error: "Too many requests. Please try again shortly." };
    return { error: `AI request failed: ${msg}` };
  }

  if (!raw) return { error: "AI returned an empty response." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "AI returned malformed JSON." };
  }

  const result = PredictionSchema.safeParse(parsed);
  if (!result.success) {
    return { error: "AI response did not match the expected format." };
  }

  // Clamp confidence_score to 0–100
  result.data.confidence_score = Math.min(
    100,
    Math.max(0, result.data.confidence_score)
  );

  return result.data;
}
