"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createDocument } from "@/actions/documents";
import { Button, Card, Input } from "@/components/ui";
import { DOCUMENT_TYPES, type DocumentType, type Teacher } from "@/types/domain";

const MAX_FILE_MB = 20;

/**
 * Adds a document: text content (required — the AI-readable layer) plus an
 * optional original file uploaded DIRECTLY to Supabase Storage from the
 * browser (RLS-scoped to the user's folder), bypassing server body limits.
 */
export function DocumentForm({
  subjectId,
  teachers,
}: {
  subjectId: string;
  teachers: Teacher[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);

    const file = data.get("file") as File | null;
    const input = {
      subjectId,
      type: String(data.get("type")) as DocumentType,
      title: String(data.get("title") ?? ""),
      content: String(data.get("content") ?? ""),
      teacherId: String(data.get("teacher_id") ?? "") || null,
    };

    startTransition(async () => {
      let storagePath: string | null = null;

      if (file && file.size > 0) {
        if (file.size > MAX_FILE_MB * 1024 * 1024) {
          setError(`File is too large (max ${MAX_FILE_MB} MB).`);
          return;
        }
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setError("Not authenticated.");
          return;
        }
        storagePath = `${user.id}/${crypto.randomUUID()}/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(storagePath, file);
        if (uploadError) {
          setError(`Upload failed: ${uploadError.message}`);
          return;
        }
      }

      const result = await createDocument({ ...input, storagePath });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <Card>
      <h2 className="mb-3 font-medium">Add document</h2>
      <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Title
            </label>
            <Input name="title" placeholder="e.g. Midterm 2024" required />
          </div>
          <div className="w-36">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Type
            </label>
            <select
              name="type"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              defaultValue="notes"
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="w-44">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Teacher (optional)
            </label>
            <select
              name="teacher_id"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              defaultValue=""
            >
              <option value="">—</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Text content (what the AI reads)
          </label>
          <textarea
            name="content"
            rows={6}
            required
            placeholder="Paste the document text here — exam questions, notes, worksheet content…"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Attach original file (optional, max {MAX_FILE_MB} MB)
          </label>
          <input name="file" type="file" className="block text-sm" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Add document"}
        </Button>
      </form>
    </Card>
  );
}
