"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { DOCUMENTS_BUCKET } from "@/lib/storage";

export type CreateExamInput = {
  subjectId: string;
  teacherId?: string | null;
  dateOfExam?: string | null;   // ISO date string "YYYY-MM-DD"
  filePath?: string | null;     // storage object path from client-side upload
  extractedText?: string;
};

export async function createExam(
  input: CreateExamInput
): Promise<{ id: string } | { error: string }> {
  if (!input.subjectId) return { error: "Missing subject." };

  const { supabase, user } = await requireUser();

  // Verify the subject belongs to this user
  const { data: subject } = await supabase
    .from("subjects")
    .select("id")
    .eq("id", input.subjectId)
    .eq("user_id", user.id)
    .single();
  if (!subject) return { error: "Subject not found." };

  // Verify teacher exists (if provided)
  if (input.teacherId) {
    const { data: teacher } = await supabase
      .from("teachers")
      .select("id")
      .eq("id", input.teacherId)
      .single();
    if (!teacher) return { error: "Teacher not found." };
  }

  const { data: inserted, error } = await supabase
    .from("exams")
    .insert({
      user_id: user.id,
      subject_id: input.subjectId,
      teacher_id: input.teacherId || null,
      date_of_exam: input.dateOfExam || null,
      file_url: input.filePath || null,
      extracted_text: input.extractedText?.trim() || null,
    })
    .select("id")
    .single();

  if (error || !inserted) return { error: error?.message ?? "Could not save exam." };

  revalidatePath(`/subjects/${input.subjectId}`, "layout");
  return { id: inserted.id as string };
}

export async function deleteExam(
  id: string,
  subjectId: string
): Promise<void> {
  if (!id) return;
  const { supabase } = await requireUser();

  // Remove file from storage first (best-effort)
  const { data: exam } = await supabase
    .from("exams")
    .select("file_url")
    .eq("id", id)
    .single();
  if (exam?.file_url) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([exam.file_url]);
  }

  await supabase.from("exams").delete().eq("id", id);
  revalidatePath(`/subjects/${subjectId}`, "layout");
}

export async function updateExamDate(
  id: string,
  dateOfExam: string
): Promise<{ ok: true } | { error: string }> {
  if (!id) return { error: "Exam ID is required." };
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("exams")
    .update({ date_of_exam: dateOfExam })
    .eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function getExamSignedUrl(
  filePath: string
): Promise<{ url: string } | { error: string }> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(filePath, 60 * 60); // 1-hour expiry
  if (error || !data) return { error: error?.message ?? "Could not generate URL." };
  return { url: data.signedUrl };
}
