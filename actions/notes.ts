"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { DOCUMENTS_BUCKET } from "@/lib/storage";

export type CreateNoteInput = {
  subjectId: string;
  noteDate?: string | null;     // ISO date string "YYYY-MM-DD"
  filePath?: string | null;     // storage object path from client-side upload
  extractedText?: string;
};

export async function createNote(
  input: CreateNoteInput
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

  const { data: inserted, error } = await supabase
    .from("notes")
    .insert({
      user_id: user.id,
      subject_id: input.subjectId,
      note_date: input.noteDate || null,
      file_url: input.filePath || null,
      extracted_text: input.extractedText?.trim() || null,
    })
    .select("id")
    .single();

  if (error || !inserted) return { error: error?.message ?? "Could not save note." };

  revalidatePath(`/subjects/${input.subjectId}`, "layout");
  return { id: inserted.id as string };
}

export async function deleteNote(
  id: string,
  subjectId: string
): Promise<void> {
  if (!id) return;
  const { supabase } = await requireUser();

  // Remove file from storage first (best-effort)
  const { data: note } = await supabase
    .from("notes")
    .select("file_url")
    .eq("id", id)
    .single();
  if (note?.file_url) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([note.file_url]);
  }

  await supabase.from("notes").delete().eq("id", id);
  revalidatePath(`/subjects/${subjectId}`, "layout");
}

export async function getNoteSignedUrl(
  filePath: string
): Promise<{ url: string } | { error: string }> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(filePath, 60 * 60); // 1-hour expiry
  if (error || !data) return { error: error?.message ?? "Could not generate URL." };
  return { url: data.signedUrl };
}
