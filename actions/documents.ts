"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { DOCUMENT_TYPES, type DocumentType } from "@/types/domain";

export type CreateDocumentInput = {
  subjectId: string;
  type: DocumentType;
  title: string;
  content: string;
  teacherId?: string | null;
  storagePath?: string | null; // set by the client after a direct upload
};

export async function createDocument(
  input: CreateDocumentInput
): Promise<{ ok: true } | { error: string }> {
  const title = input.title.trim();
  const content = input.content.trim();

  if (!input.subjectId) return { error: "Missing subject." };
  if (!DOCUMENT_TYPES.includes(input.type)) return { error: "Invalid type." };
  if (!title) return { error: "Title is required." };
  if (!content) {
    return {
      error:
        "Text content is required — it's what the AI reads. Paste the document text (file attachment is optional).",
    };
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("documents").insert({
    user_id: user.id,
    subject_id: input.subjectId,
    teacher_id: input.teacherId || null,
    type: input.type,
    title,
    content,
    storage_path: input.storagePath || null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/subjects/${input.subjectId}`, "layout");
  return { ok: true };
}

export type UpdateDocumentInput = {
  id: string;
  subjectId: string;
  type: DocumentType;
  title: string;
  content: string;
  teacherId?: string | null;
};

export async function updateDocument(
  input: UpdateDocumentInput
): Promise<{ ok: true } | { error: string }> {
  const title = input.title.trim();
  const content = input.content.trim();

  if (!input.id) return { error: "Missing document." };
  if (!DOCUMENT_TYPES.includes(input.type)) return { error: "Invalid type." };
  if (!title) return { error: "Title is required." };
  if (!content) return { error: "Text content is required." };

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("documents")
    .update({
      type: input.type,
      title,
      content,
      teacher_id: input.teacherId || null,
    })
    .eq("id", input.id);
  if (error) return { error: error.message };

  revalidatePath(`/subjects/${input.subjectId}`, "layout");
  return { ok: true };
}

export async function deleteDocument(
  id: string,
  subjectId: string
): Promise<void> {
  if (!id) return;
  const { supabase } = await requireUser();

  // Remove the attached file first (if any); RLS scopes both operations.
  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", id)
    .single();
  if (doc?.storage_path) {
    await supabase.storage.from("documents").remove([doc.storage_path]);
  }

  await supabase.from("documents").delete().eq("id", id);
  revalidatePath(`/subjects/${subjectId}`, "layout");
}
