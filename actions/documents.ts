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
  if (title.length > 200) return { error: "Title must be 200 characters or fewer." };
  if (!content) {
    return {
      error:
        "Text content is required — it's what the AI reads. Paste the document text (file attachment is optional).",
    };
  }
  if (content.length > 500_000) {
    return { error: "Content exceeds the 500 000 character limit. Please trim the document." };
  }

  const { supabase, user } = await requireUser();

  const { data: subjectRow } = await supabase
    .from("subjects")
    .select("id")
    .eq("id", input.subjectId)
    .eq("user_id", user.id)
    .single();
  if (!subjectRow) return { error: "Subject not found." };

  if (input.teacherId) {
    const { data: teacherRow } = await supabase
      .from("teachers")
      .select("id")
      .eq("id", input.teacherId)
      .single();
    if (!teacherRow) return { error: "Teacher not found." };
  }

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
  if (title.length > 200) return { error: "Title must be 200 characters or fewer." };
  if (!content) return { error: "Text content is required." };
  if (content.length > 500_000) {
    return { error: "Content exceeds the 500 000 character limit. Please trim the document." };
  }

  const { supabase } = await requireUser();

  if (input.teacherId) {
    const { data: teacherRow } = await supabase
      .from("teachers")
      .select("id")
      .eq("id", input.teacherId)
      .single();
    if (!teacherRow) return { error: "Teacher not found." };
  }

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
