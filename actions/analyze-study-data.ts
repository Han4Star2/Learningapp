"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getOpenAIClient, CHAT_MODEL } from "@/lib/openai/client";

// ── Output schema ────────────────────────────────────────────────────────────

const AnalysisSchema = z.object({
  topics: z.array(z.string()),
  weak_points: z.array(z.string()),
  strong_points: z.array(z.string()),
  study_recommendations: z.array(z.string()),
});

export type StudyAnalysis = z.infer<typeof AnalysisSchema>;

// ── Action ───────────────────────────────────────────────────────────────────

export async function analyzeStudyData(
  subjectId: string
): Promise<StudyAnalysis | { error: string }> {
  if (!subjectId) return { error: "Subject ID is required." };

  const { supabase } = await requireUser();

  // Fetch exams and notes for this subject in parallel
  const [{ data: examRows }, { data: noteRows }] = await Promise.all([
    supabase
      .from("exams")
      .select("extracted_text, date_of_exam")
      .eq("subject_id", subjectId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("notes")
      .select("extracted_text, note_date")
      .eq("subject_id", subjectId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const exams = (examRows ?? []).filter((r) => r.extracted_text?.trim());
  const notes = (noteRows ?? []).filter((r) => r.extracted_text?.trim());

  if (exams.length === 0 && notes.length === 0) {
    return {
      error:
        "No text content found. Add exams or notes with extracted text to this subject first.",
    };
  }

  // Build the user message
  const sections: string[] = [];

  if (exams.length > 0) {
    sections.push(
      "## EXAMS\n" +
        exams
          .map((e, i) => {
            const date = e.date_of_exam ? ` (${e.date_of_exam})` : "";
            return `### Exam ${i + 1}${date}\n${e.extracted_text!.slice(0, 8_000)}`;
          })
          .join("\n\n")
    );
  }

  if (notes.length > 0) {
    sections.push(
      "## NOTES\n" +
        notes
          .map((n, i) => {
            const date = n.note_date ? ` (${n.note_date})` : "";
            return `### Note ${i + 1}${date}\n${n.extracted_text!.slice(0, 8_000)}`;
          })
          .join("\n\n")
    );
  }

  const userMessage = sections.join("\n\n");

  // Call OpenAI
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
      temperature: 0.3,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "study_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              topics: {
                type: "array",
                items: { type: "string" },
                description: "All distinct topics identified in the material.",
              },
              weak_points: {
                type: "array",
                items: { type: "string" },
                description:
                  "Areas where the student shows gaps, errors, or low coverage.",
              },
              strong_points: {
                type: "array",
                items: { type: "string" },
                description:
                  "Areas where the student demonstrates good understanding or consistent coverage.",
              },
              study_recommendations: {
                type: "array",
                items: { type: "string" },
                description:
                  "Concrete, actionable study suggestions based on the weak points.",
              },
            },
            required: [
              "topics",
              "weak_points",
              "strong_points",
              "study_recommendations",
            ],
            additionalProperties: false,
          },
        },
      },
      messages: [
        {
          role: "system",
          content: `You are an expert academic tutor. Analyse the student's exam papers and notes to identify:
- All topics covered in the material
- Weak points: gaps in knowledge, recurring mistakes, or under-covered areas
- Strong points: concepts handled well or covered thoroughly
- Study recommendations: specific, actionable steps to address the weak points

Be concise. Each array item should be a single clear sentence or phrase. Do not repeat the same point across arrays.`,
        },
        { role: "user", content: userMessage },
      ],
    });

    raw = completion.choices[0]?.message?.content ?? null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("API key")) return { error: "AI service authentication failed." };
    if (msg.includes("rate limit")) return { error: "Too many requests. Please try again shortly." };
    return { error: `AI request failed: ${msg}` };
  }

  if (!raw) return { error: "AI returned an empty response." };

  // Parse + validate
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "AI returned malformed JSON." };
  }

  const result = AnalysisSchema.safeParse(parsed);
  if (!result.success) {
    return { error: "AI response did not match the expected format." };
  }

  return result.data;
}
