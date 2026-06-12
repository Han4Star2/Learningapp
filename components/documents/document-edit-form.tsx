"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateDocument } from "@/actions/documents";
import { DOCUMENT_TYPES, type DocumentType, type StudyDocument, type Teacher } from "@/types/domain";

export function DocumentEditForm({
  document,
  subjectId,
  teachers,
}: {
  document: StudyDocument;
  subjectId: string;
  teachers: Teacher[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(document.title);
  const [type, setType] = useState<DocumentType>(document.type);
  const [teacherId, setTeacherId] = useState(document.teacher_id ?? "");
  const [content, setContent] = useState(document.content ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateDocument({
        id: document.id,
        subjectId,
        type,
        title,
        content,
        teacherId: teacherId || null,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      toast.success("Document saved.");
      router.push(`/subjects/${subjectId}/documents/${document.id}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Midterm 2024"
          maxLength={200}
          required
          autoFocus
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="type">Type</Label>
          <Select id="type" value={type} onChange={(e) => setType(e.target.value as DocumentType)}>
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="teacher">Teacher (optional)</Label>
          <Select id="teacher" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
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
        <Label htmlFor="content">
          Text content{" "}
          <span className="text-xs text-muted-foreground">
            ({content.length.toLocaleString()} / 500 000 chars)
          </span>
        </Label>
        <Textarea
          id="content"
          rows={14}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste the document text here…"
          required
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => router.push(`/subjects/${subjectId}/documents/${document.id}`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
