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
import { createExam } from "@/actions/exams";
import { uploadFile, MAX_FILE_MB } from "@/lib/storage";
import type { Teacher } from "@/types/domain";

const ACCEPTED = "image/jpeg,image/png,image/webp,application/pdf";

export function ExamUploadDialog({
  trigger,
  subjectId,
  teachers,
}: {
  trigger: React.ReactNode;
  subjectId: string;
  teachers: Teacher[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [teacherId, setTeacherId] = useState("");
  const [dateOfExam, setDateOfExam] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setTeacherId("");
    setDateOfExam("");
    setExtractedText("");
    setFile(null);
    setError(null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      // Upload file first (client-side → Storage)
      let filePath: string | null = null;
      if (file && file.size > 0) {
        const upload = await uploadFile(file);
        if ("error" in upload) { setError(upload.error); return; }
        filePath = upload.path;
      }

      const result = await createExam({
        subjectId,
        teacherId: teacherId || null,
        dateOfExam: dateOfExam || null,
        filePath,
        extractedText,
      });

      if ("error" in result) { setError(result.error); return; }

      toast.success("Exam uploaded.");
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
          <DialogTitle>Upload exam</DialogTitle>
          <DialogDescription>
            Attach a scanned exam file and optionally paste the extracted text.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Teacher */}
          <div className="space-y-1.5">
            <Label htmlFor="exam-teacher">Teacher (optional)</Label>
            <Select
              id="exam-teacher"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              disabled={pending}
            >
              <option value="">No teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="exam-date">Date of exam (optional)</Label>
            <Input
              id="exam-date"
              type="date"
              value={dateOfExam}
              onChange={(e) => setDateOfExam(e.target.value)}
              disabled={pending}
            />
          </div>

          {/* File */}
          <div className="space-y-1.5">
            <Label htmlFor="exam-file">
              File (optional — image or PDF, max {MAX_FILE_MB} MB)
            </Label>
            <Input
              id="exam-file"
              type="file"
              accept={ACCEPTED}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={pending}
            />
          </div>

          {/* Extracted text */}
          <div className="space-y-1.5">
            <Label htmlFor="exam-text">
              Extracted text (optional — paste content for AI use)
            </Label>
            <Textarea
              id="exam-text"
              rows={5}
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              placeholder="Paste the exam text here…"
              disabled={pending}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Uploading…" : "Upload exam"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
