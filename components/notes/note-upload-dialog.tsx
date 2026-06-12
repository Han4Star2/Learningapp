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
import { Textarea } from "@/components/ui/textarea";
import { createNote } from "@/actions/notes";
import { uploadFile, MAX_FILE_MB } from "@/lib/storage";

const ACCEPTED = "image/jpeg,image/png,image/webp,application/pdf";

export function NoteUploadDialog({
  trigger,
  subjectId,
}: {
  trigger: React.ReactNode;
  subjectId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [noteDate, setNoteDate] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setNoteDate("");
    setExtractedText("");
    setFile(null);
    setError(null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!file && !extractedText.trim()) {
      setError("Provide a file, text, or both.");
      return;
    }

    startTransition(async () => {
      // Upload file first (client-side → Storage)
      let filePath: string | null = null;
      if (file && file.size > 0) {
        const upload = await uploadFile(file);
        if ("error" in upload) { setError(upload.error); return; }
        filePath = upload.path;
      }

      const result = await createNote({
        subjectId,
        noteDate: noteDate || null,
        filePath,
        extractedText,
      });

      if ("error" in result) { setError(result.error); return; }

      toast.success("Note uploaded.");
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload note</DialogTitle>
          <DialogDescription>
            Attach a scan or image and optionally paste the text content.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="note-date">Note date (optional)</Label>
            <Input
              id="note-date"
              type="date"
              value={noteDate}
              onChange={(e) => setNoteDate(e.target.value)}
              disabled={pending}
            />
          </div>

          {/* File */}
          <div className="space-y-1.5">
            <Label htmlFor="note-file">
              File (image or PDF, max {MAX_FILE_MB} MB)
            </Label>
            <Input
              id="note-file"
              type="file"
              accept={ACCEPTED}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={pending}
            />
          </div>

          {/* Extracted text */}
          <div className="space-y-1.5">
            <Label htmlFor="note-text">
              Text content (optional — paste for AI use)
            </Label>
            <Textarea
              id="note-text"
              rows={5}
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              placeholder="Paste the note text here…"
              disabled={pending}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Uploading…" : "Upload note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
