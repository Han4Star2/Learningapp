"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createDocument, updateDocument } from "@/actions/documents";
import { uploadDocumentFile, MAX_FILE_MB } from "@/lib/storage";
import {
  DOCUMENT_TYPES,
  type DocumentType,
  type StudyDocument,
  type Teacher,
} from "@/types/domain";

/**
 * Create or edit a document. On create, an optional original file is uploaded
 * directly to Storage before the row is written. On edit, only the text fields
 * change (the attached file is left as-is).
 */
export function DocumentDialog({
  trigger,
  subjectId,
  teachers,
  document,
}: {
  trigger: React.ReactNode;
  subjectId: string;
  teachers: Teacher[];
  document?: StudyDocument;
}) {
  const router = useRouter();
  const editing = Boolean(document);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(document?.title ?? "");
  const [type, setType] = useState<DocumentType>(document?.type ?? "notes");
  const [teacherId, setTeacherId] = useState(document?.teacher_id ?? "");
  const [content, setContent] = useState(document?.content ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      if (editing) {
        const result = await updateDocument({
          id: document!.id,
          subjectId,
          type,
          title,
          content,
          teacherId: teacherId || null,
        });
        if ("error" in result) return setError(result.error);
        toast.success("Document saved.");
      } else {
        let storagePath: string | null = null;
        if (file && file.size > 0) {
          const upload = await uploadDocumentFile(file);
          if ("error" in upload) return setError(upload.error);
          storagePath = upload.path;
        }
        const result = await createDocument({
          subjectId,
          type,
          title,
          content,
          teacherId: teacherId || null,
          storagePath,
        });
        if ("error" in result) return setError(result.error);
        toast.success("Document added.");
      }

      setOpen(false);
      if (!editing) {
        setTitle("");
        setType("notes");
        setTeacherId("");
        setContent("");
        setFile(null);
      }
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit document" : "Add document"}</DialogTitle>
          <DialogDescription>
            Paste the text content — that is what the AI reads. Tag past exams
            with a teacher to capture their style.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="doc-title">Title</Label>
              <Input
                id="doc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Midterm 2024"
                autoFocus
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-type">Type</Label>
              <Select
                id="doc-type"
                value={type}
                onChange={(e) => setType(e.target.value as DocumentType)}
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-teacher">Teacher (optional)</Label>
              <Select
                id="doc-teacher"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
              >
                <option value="">No teacher</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doc-content">Text content</Label>
            <Textarea
              id="doc-content"
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste the document text here — exam questions, notes, worksheet content…"
              required
            />
          </div>

          {!editing && (
            <div className="space-y-1.5">
              <Label htmlFor="doc-file">
                Attach original file (optional, max {MAX_FILE_MB} MB)
              </Label>
              <Input
                id="doc-file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : editing ? "Save changes" : "Add document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
