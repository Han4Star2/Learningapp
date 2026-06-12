"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getOpenAIClient, CHAT_MODEL } from "@/lib/openai/client";

// ── I/O schemas ──────────────────────────────────────────────────────────────

const PredictionSchema = z.object({
  predicted_questions: z.array(
    z.object({
      question:     z.string(),
      topic:        z.string(),
      likely_marks: z.number().int(),
      confidence:   z.enum(["high", "medium", "low"]),
      reasoning:    z.string(),
    })
  ),
  likely_topics: z.array(
    z.object({
      topic:    z.string(),
      weight:   z.number(),
      evidence: z.string(),
    })
  ),
  confidence_score:  z.number(),
  reasoning_summary: z.string(),
});

export type ExamPrediction = z.infer<typeof PredictionSchema>;

export type PredictExamInput = {
  subjectId: string;
  teacherId: string;
  topicOverride?: string;    // comma-separated topics
  examDate?: string;
  webSearchFallback?: boolean; // user chose "skip upload — AI uses own knowledge"
};

/** Returned when the AI needs topic-specific material but none is uploaded. */
export type NeedsMaterial = {
  needs_material: true;
  missingTopics: string[];
};

export type PredictExamResult = ExamPrediction | { error: string } | NeedsMaterial;

// ── JSON schema for OpenAI structured output ─────────────────────────────────

const RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    predicted_questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question:     { type: "string" },
          topic:        { type: "string" },
          likely_marks: { type: "integer" },
          confidence:   { type: "string", enum: ["high", "medium", "low"] },
          reasoning:    { type: "string" },
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
    confidence_score:  { type: "integer" },
    reasoning_summary: { type: "string" },
  },
  required: ["predicted_questions", "likely_topics", "confidence_score", "reasoning_summary"],
  additionalProperties: false,
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

const CHAR_LIMIT = 8_000;

function truncate(text: string): string {
  return text.length > CHAR_LIMIT ? text.slice(0, CHAR_LIMIT) + "\n[…truncated]" : text;
}

/** Split "Quadratische Gleichungen, Lineare Funktionen" → ["quadratische gleichungen", "lineare funktionen"] */
function parseKeywords(topicOverride: string): string[] {
  return topicOverride
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

/** True if doc title or first 600 chars of content contain at least one keyword. */
function docMatchesTopic(
  doc: { title: string; content: string | null },
  keywords: string[]
): boolean {
  const hay = `${doc.title} ${(doc.content ?? "").slice(0, 600)}`.toLowerCase();
  return keywords.some((kw) => hay.includes(kw));
}

function buildSystemPrompt(
  mode: "history" | "topic_only" | "web_fallback",
  subjectName: string,
  topicOverride: string | undefined,
  examDate: string | undefined
): string {
  const dateHint = examDate
    ? `\n\nThe upcoming exam is on ${examDate}. Weight recent gaps more heavily.`
    : "";

  if (mode === "web_fallback") {
    return `You are an expert exam prediction assistant. No uploaded material was found for the requested topics, so base your predictions entirely on:
1. Your knowledge of standard ${subjectName} curriculum (secondary/university level)
2. Common question patterns and mark distributions for these topics
3. Any teacher exam patterns provided (if available)

Be specific and concrete. Generate realistic exam questions a teacher would actually ask.${dateHint}`;
  }

  if (mode === "topic_only") {
    return `You are an expert exam prediction assistant. The student has specified exact topics — base predictions on those topics and any uploaded material. Only use teacher past exams that cover the SAME topics; ignore unrelated past exams.${dateHint}`;
  }

  // history mode
  return `You are an expert exam prediction assistant. Predict what will appear in the next exam by:

1. TEACHER PATTERN ANALYSIS — Study the teacher's past exams: question styles, mark distributions, favourite topics, phrasing, section structure. Weight recent exams more heavily.
2. TOPIC FREQUENCY — Topics the teacher tests often vs. rarely. Untested topics are higher probability.
3. COVERAGE GAPS — Cross-reference subject content with what has already been tested.
4. CONFIDENCE SCORING — Rate each prediction by how strongly evidence supports it.

Be analytical and specific.${dateHint}`;
}

// ── Server action ─────────────────────────────────────────────────────────────

export async function predictExam(
  input: PredictExamInput
): Promise<PredictExamResult> {
  if (!input.subjectId) return { error: "Subject ID is required." };
  if (!input.teacherId) return { error: "Teacher ID is required." };

  const { supabase } = await requireUser();
  const topics = input.topicOverride?.trim()
    ? parseKeywords(input.topicOverride)
    : [];
  const hasTopicOverride = topics.length > 0;

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const [
    { data: subjectRow },
    { data: teacherRow },
    { data: pastExamRows },
    { data: subjectDocRows },
  ] = await Promise.all([
    supabase.from("subjects").select("name").eq("id", input.subjectId).single(),
    supabase.from("teachers").select("name").eq("id", input.teacherId).single(),
    supabase
      .from("documents")
      .select("title, content, created_at")
      .eq("teacher_id", input.teacherId)
      .eq("type", "exam")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("documents")
      .select("title, content, created_at")
      .eq("subject_id", input.subjectId)
      .order("created_at", { ascending: true })
      .limit(20),
  ]);

  if (!subjectRow) return { error: "Subject not found." };
  if (!teacherRow) return { error: "Teacher not found." };

  const allPastExams  = (pastExamRows  ?? []).filter((d) => d.content?.trim());
  const allSubjectDocs = (subjectDocRows ?? []).filter((d) => d.content?.trim());

  // ── Topic-based filtering ─────────────────────────────────────────────────
  // For past exams: when topic override is set, only include exams that
  // cover the same topic. Unrelated past exams pollute pattern analysis.
  const pastExams = hasTopicOverride
    ? allPastExams.filter((e) => docMatchesTopic(e, topics))
    : allPastExams;

  // For subject docs: include all, but annotate which ones match the topic
  // so the AI prioritises them.
  const matchingDocs = hasTopicOverride
    ? allSubjectDocs.filter((d) => docMatchesTopic(d, topics))
    : allSubjectDocs;
  const otherDocs = hasTopicOverride
    ? allSubjectDocs.filter((d) => !docMatchesTopic(d, topics))
    : [];

  // ── Missing material check ────────────────────────────────────────────────
  // If a topic override is given but NO subject docs match it, ask the user
  // to upload material — unless they've already chosen the web fallback.
  if (
    hasTopicOverride &&
    matchingDocs.length === 0 &&
    !input.webSearchFallback
  ) {
    return {
      needs_material: true,
      missingTopics: topics.map((t) =>
        t.charAt(0).toUpperCase() + t.slice(1)
      ),
    };
  }

  // ── Decide mode ───────────────────────────────────────────────────────────
  const mode = input.webSearchFallback
    ? "web_fallback"
    : hasTopicOverride
    ? "topic_only"
    : "history";

  // Soft warning: no past exams and no topic override → proceed without exams
  // (don't hard-error; the AI can still use subject docs)

  // ── Build prompt ──────────────────────────────────────────────────────────
  const parts: string[] = [
    `# SUBJECT: ${subjectRow.name}`,
    `# TEACHER: ${teacherRow.name}`,
  ];

  if (hasTopicOverride) {
    parts.push(
      `# FOCUS TOPICS (predict only these)\n${input.topicOverride!.trim()}`
    );
  }

  if (matchingDocs.length > 0) {
    parts.push(
      `# SUBJECT MATERIAL — MATCHING TOPICS (highest priority)\n` +
        matchingDocs
          .map((d) => `## ${d.title}\n${truncate(d.content!)}`)
          .join("\n\n")
    );
  }

  if (otherDocs.length > 0) {
    parts.push(
      `# SUBJECT MATERIAL — OTHER (lower priority; use for context only)\n` +
        otherDocs
          .map((d) => `## ${d.title}\n${truncate(d.content!)}`)
          .join("\n\n")
    );
  }

  if (!hasTopicOverride && allSubjectDocs.length > 0) {
    parts.push(
      `# SUBJECT CONTENT\n` +
        allSubjectDocs
          .map((d) => `## ${d.title}\n${truncate(d.content!)}`)
          .join("\n\n")
    );
  }

  if (pastExams.length > 0) {
    const label = hasTopicOverride
      ? `# PAST EXAMS BY ${teacherRow.name.toUpperCase()} — TOPIC-MATCHED (analyse patterns)`
      : `# PAST EXAMS BY ${teacherRow.name.toUpperCase()} (analyse patterns)`;
    parts.push(
      label + "\n" +
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
  } else if (!hasTopicOverride) {
    parts.push(
      `# NOTE: No past exams found for this teacher yet. Base predictions on subject content and typical exam patterns for this subject.`
    );
  }

  if (input.examDate) {
    parts.push(`# UPCOMING EXAM DATE: ${input.examDate}`);
  }

  if (input.webSearchFallback) {
    parts.push(
      `# NOTE: No uploaded material was found for the focus topics. Use your training knowledge of standard ${subjectRow.name} curriculum to fill the gaps.`
    );
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
        {
          role: "system",
          content: buildSystemPrompt(mode, subjectRow.name, input.topicOverride, input.examDate),
        },
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
  if (!result.success) return { error: "AI response did not match the expected format." };

  result.data.confidence_score = Math.min(100, Math.max(0, result.data.confidence_score));
  return result.data;
}
