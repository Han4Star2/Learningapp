"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { generateStructured, type GenerateOptions } from "@/lib/ai/generate";
import { ExamSchema, QuizSchema, FlashcardSetSchema } from "@/lib/ai/schemas";
import { evaluateExamQuality, evaluateQuizQuality, evaluateFlashcardQuality } from "@/lib/ai/quality";
import {
  AI_CONTENT_TYPES,
  type AIContentType,
  type GenerationSettings,
  type StudyDocument,
  type Subject,
} from "@/types/domain";

const VALID_DIFFICULTIES: GenerateOptions["difficulty"][] = [
  "easy",
  "medium",
  "hard",
  "mixed",
];

const SCHEMA_MAP = {
  exam: ExamSchema,
  quiz: QuizSchema,
  flashcards: FlashcardSetSchema,
} as const;

const QUALITY_MAP = {
  exam: evaluateExamQuality,
  quiz: evaluateQuizQuality,
  flashcards: evaluateFlashcardQuality,
} as const;

export type GenerateInput = {
  subjectId: string;
  type: AIContentType;
  teacherId?: string | null;
  count: number;
  difficulty: GenerateOptions["difficulty"];
  totalMarks?: number;
};

/**
 * Synchronous AI generation (MVP — no queue):
 * CONTENT layer = all subject documents; STYLE layer = the teacher's past
 * exams. Result is quality-validated then persisted to ai_generated_content.
 */
export async function generateContent(
  input: GenerateInput
): Promise<{ id: string } | { error: string }> {
  if (!AI_CONTENT_TYPES.includes(input.type)) return { error: "Invalid type." };
  if (!VALID_DIFFICULTIES.includes(input.difficulty))
    return { error: "Invalid difficulty." };
  const count = Math.min(Math.max(Math.round(input.count) || 10, 1), 50);
  const totalMarks =
    input.type === "exam"
      ? Math.min(Math.max(Math.round(input.totalMarks ?? count * 5) || count * 5, 5), 500)
      : undefined;

  const { supabase, user } = await requireUser();

  const { data: subjectRow } = await supabase
    .from("subjects")
    .select("*")
    .eq("id", input.subjectId)
    .single();
  if (!subjectRow) return { error: "Subject not found." };
  const subject = subjectRow as Subject;

  const { data: contentRows } = await supabase
    .from("documents")
    .select("*")
    .eq("subject_id", subject.id)
    .order("created_at", { ascending: true });
  const contentDocs = ((contentRows ?? []) as StudyDocument[]).filter(
    (d) => (d.content ?? "").trim().length > 0
  );
  if (contentDocs.length === 0) {
    return {
      error:
        "This subject has no documents with text content yet. Add notes or past exams first.",
    };
  }

  let styleDocs: StudyDocument[] = [];
  if (input.teacherId) {
    const { data: styleRows } = await supabase
      .from("documents")
      .select("*")
      .eq("teacher_id", input.teacherId)
      .eq("type", "exam")
      .order("created_at", { ascending: true });
    styleDocs = ((styleRows ?? []) as StudyDocument[]).filter(
      (d) => (d.content ?? "").trim().length > 0
    );
  }

  let title: string;
  let json: unknown;
  try {
    ({ title, json } = await generateStructured({
      type: input.type,
      subjectName: subject.name,
      contentDocs,
      styleDocs,
      options: { count, difficulty: input.difficulty, totalMarks },
    }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed.";
    return { error: `AI generation failed: ${message}` };
  }

  // Structure validation
  const schemaResult = SCHEMA_MAP[input.type].safeParse(json);
  if (!schemaResult.success) {
    return {
      error:
        "Generated content didn't match the expected format. Please try again.",
    };
  }

  // Quality evaluation — reject obviously bad output
  const qualityError = (QUALITY_MAP[input.type] as (data: typeof schemaResult.data) => string | null)(schemaResult.data);
  if (qualityError) {
    return {
      error: `Generated content failed quality checks: ${qualityError} Please try again.`,
    };
  }

  const sourceIds = [...contentDocs, ...styleDocs].map((d) => d.id);
  const generationSettings: GenerationSettings = {
    count,
    difficulty: input.difficulty,
    ...(totalMarks !== undefined ? { total_marks: totalMarks } : {}),
  };

  const { data: inserted, error } = await supabase
    .from("ai_generated_content")
    .insert({
      user_id: user.id,
      subject_id: subject.id,
      teacher_id: input.teacherId || null,
      type: input.type,
      title,
      content_json: json,
      source_document_ids: sourceIds,
      generation_settings: generationSettings,
    })
    .select("id")
    .single();
  if (error || !inserted) {
    return { error: error?.message ?? "Could not save the generated content." };
  }

  revalidatePath(`/subjects/${subject.id}`, "layout");
  return { id: inserted.id as string };
}

export async function deleteGeneratedContent(
  id: string,
  subjectId: string
): Promise<void> {
  if (!id) return;
  const { supabase } = await requireUser();
  await supabase.from("ai_generated_content").delete().eq("id", id);
  revalidatePath(`/subjects/${subjectId}`, "layout");
}

export async function renameGeneratedContent(
  id: string,
  subjectId: string,
  newTitle: string
): Promise<{ ok: true } | { error: string }> {
  const title = newTitle.trim();
  if (!title) return { error: "Title is required." };
  if (title.length > 200) return { error: "Title must be 200 characters or fewer." };
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("ai_generated_content")
    .update({ title })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/subjects/${subjectId}`, "layout");
  return { ok: true };
}

export async function duplicateGeneratedContent(
  id: string,
  subjectId: string
): Promise<{ ok: true } | { error: string }> {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("ai_generated_content")
    .select("*")
    .eq("id", id)
    .single();
  if (!data) return { error: "Item not found." };
  const { error } = await supabase.from("ai_generated_content").insert({
    user_id: user.id,
    subject_id: data.subject_id,
    teacher_id: data.teacher_id,
    type: data.type,
    title: `${data.title} (Copy)`,
    content_json: data.content_json,
    source_document_ids: data.source_document_ids,
    generation_settings: data.generation_settings ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath(`/subjects/${subjectId}`, "layout");
  return { ok: true };
}
