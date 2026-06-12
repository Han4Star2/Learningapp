import { createClient } from "@/lib/supabase/client";

/** The single private bucket all user documents live in. */
export const DOCUMENTS_BUCKET = "documents";

export const MAX_FILE_MB = 20;

/**
 * Builds the storage object path for a user's file. Files are namespaced by
 * user id so the bucket RLS policy (`foldername[1] = auth.uid()`) isolates them.
 */
export function buildStoragePath(userId: string, fileName: string): string {
  return `${userId}/${crypto.randomUUID()}/${fileName}`;
}

/**
 * Uploads a file directly from the browser to Supabase Storage, bypassing the
 * Next.js server body limit. Returns the stored object path on success.
 */
export async function uploadDocumentFile(
  file: File
): Promise<{ path: string } | { error: string }> {
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    return { error: `File is too large (max ${MAX_FILE_MB} MB).` };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const path = buildStoragePath(user.id, file.name);
  const { error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, file);
  if (error) return { error: `Upload failed: ${error.message}` };

  return { path };
}
