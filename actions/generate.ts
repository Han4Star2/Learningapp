"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { generateStructured, type GenerateOptions } from "@/lib/ai/generate";
import {
  AI_CONTENT_TYPES,
  type AIContentType,
  type StudyDocument,
  type Subject,
} from "@/types/domain";

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
 * exams. Result is persisted to ai_generated_content and its id returned.
 */
export async function generateContent(
  input: GenerateInput
): Promise<{ id: string } | { error: string }> {
  if (!AI_CONTENT_TYPES.includes(input.type)) return { error: "Invalid type." };
  const count = Math.min(Math.max(Math.round(input.count) || 10, 1), 50);

  const { supabase, user } = await requireUser();

  const { data: subjectRow } = await supabase
    .from("subjects")
    .select("*")
    .eq("id", input.subjectId)
    .single();
  if (!subjectRow) return { error: "Subject not found." };
  const subject = subjectRow as Subject;

  // CONTENT layer — every document in the subject.
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

  // STYLE layer — the chosen teacher's past exams (may span subjects).
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
      options: {
        count,
        difficulty: input.difficulty,
        totalMarks: input.totalMarks,
      },
    }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed.";
    return { error: `AI generation failed: ${message}` };
  }

  const sourceIds = [...contentDocs, ...styleDocs].map((d) => d.id);
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
