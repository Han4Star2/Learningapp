"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Upload, X, Loader2, AlertTriangle, CheckCircle2,
  CalendarClock, ArrowLeft,
} from "lucide-react";
import { uploadFile } from "@/lib/storage";
import { processAndSaveExam } from "@/actions/process-exam-images";
import { updateExamDate } from "@/actions/exams";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Subject, Teacher } from "@/types/domain";

type Step = "files" | "metadata" | "processing" | "done";
type SavedExam = { id: string; detectedDate: string | null; dateMismatch: boolean };

export function ExamUploader({
  subjects,
  teachers,
  onBack,
}: {
  subjects: Subject[];
  teachers: Teacher[];
  onBack: () => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("files");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [teacherId, setTeacherId] = useState(teachers[0]?.id ?? "");
  const [dateOfExam, setDateOfExam] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedExam | null>(null);
  const [pending, startTransition] = useTransition();

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    const imgs = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    if (imgs.length === 0) return;
    const newPreviews = imgs.map((f) => URL.createObjectURL(f));
    setFiles((prev) => [...prev, ...imgs]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  }

  function removeFile(idx: number) {
    URL.revokeObjectURL(previews[idx]);
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0 || !subjectId) return;
    setError(null);
    setStep("processing");

    startTransition(async () => {
      // 1 — Upload all pages to Supabase Storage
      setStatusMsg("Bilder hochladen…");
      const paths: string[] = [];
      for (const file of files) {
        const result = await uploadFile(file);
        if ("error" in result) {
          setError(result.error);
          setStep("metadata");
          return;
        }
        paths.push(result.path);
      }

      // 2 — AI extraction + save
      setStatusMsg("Text extrahieren & Datum prüfen…");
      const result = await processAndSaveExam({
        subjectId,
        teacherId: teacherId || null,
        dateOfExam: dateOfExam || null,
        paths,
      });

      if ("error" in result) {
        setError(result.error);
        setStep("metadata");
        return;
      }

      setSaved(result);
      setStep("done");
    });
  }

  // After date warning: user accepts AI date
  function applyDetectedDate() {
    if (!saved?.detectedDate || !saved.id) return;
    startTransition(async () => {
      await updateExamDate(saved.id, saved.detectedDate!);
      setSaved((prev) => prev ? { ...prev, dateMismatch: false } : prev);
      router.refresh();
    });
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (step === "processing") {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <div className="relative flex size-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-900/30">
          <Loader2 className="size-7 animate-spin" />
        </div>
        <div>
          <p className="font-semibold">{statusMsg}</p>
          <p className="mt-1 text-sm text-muted-foreground">Bitte warte — das dauert 20–40 Sekunden.</p>
        </div>
        {/* Step indicators */}
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <ProcessingStep label="Bilder hochladen" done={statusMsg.includes("extrahieren")} />
          <ProcessingStep label="Text extrahieren & Datum erkennen" done={false} active={statusMsg.includes("extrahieren")} />
        </div>
      </div>
    );
  }

  if (step === "done" && saved) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
            <CheckCircle2 className="size-7" />
          </div>
          <div>
            <p className="text-lg font-semibold">Prüfung gespeichert</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {files.length} Seite{files.length !== 1 ? "n" : ""} hochgeladen und Text extrahiert.
            </p>
          </div>
        </div>

        {/* Date mismatch warning */}
        {saved.dateMismatch && saved.detectedDate && (
          <Card className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <CalendarClock className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="space-y-1">
                  <p className="font-semibold text-sm text-amber-900 dark:text-amber-300">
                    Datum stimmt nicht überein
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-400">
                    Die KI hat im Prüfungstext{" "}
                    <span className="font-mono font-semibold">{saved.detectedDate}</span>{" "}
                    gefunden — du hast{" "}
                    <span className="font-mono font-semibold">{dateOfExam}</span>{" "}
                    eingegeben.
                  </p>
                  <p className="text-xs text-amber-700/70 dark:text-amber-500">
                    Prüfe das Original-Dokument und wähle das richtige Datum.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-400 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300"
                  onClick={applyDetectedDate}
                  disabled={pending}
                >
                  {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  KI-Datum übernehmen ({saved.detectedDate})
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-amber-800 dark:text-amber-400"
                  onClick={() => setSaved((prev) => prev ? { ...prev, dateMismatch: false } : prev)}
                >
                  Mein Datum behalten ({dateOfExam})
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="size-4" />
            Weitere hochladen
          </Button>
          <Button onClick={() => router.push(`/subjects/${subjectId}/exams`)}>
            Prüfungen ansehen
          </Button>
        </div>
      </div>
    );
  }

  // ── File selection step ──────────────────────────────────────────────────────
  if (step === "files") {
    return (
      <div className="space-y-5">
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" /> Zurück
        </button>

        {/* Drop zone */}
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-200",
            "border-border hover:border-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-950/20",
            files.length > 0 && "border-violet-400 bg-violet-50/30 dark:bg-violet-950/10"
          )}
        >
          <div className="flex size-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/30">
            <Upload className="size-6" />
          </div>
          <div>
            <p className="font-semibold">Prüfungsseiten hierher ziehen</p>
            <p className="mt-1 text-sm text-muted-foreground">
              oder klicken — mehrere Bilder für mehrseitige Prüfungen
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {/* Thumbnails */}
        {files.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              {files.length} Seite{files.length !== 1 ? "n" : ""} ausgewählt
            </p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {previews.map((src, i) => (
                <div key={i} className="group relative aspect-[3/4] overflow-hidden rounded-lg border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Seite ${i + 1}`} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="text-[10px] font-mono text-white/80">S.{i + 1}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      className="flex size-5 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-red-500"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={() => setStep("metadata")} disabled={files.length === 0}>
              Weiter zu Details
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ── Metadata step ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <button type="button" onClick={() => setStep("files")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-4" /> Zurück zu den Bildern
      </button>

      <div className="text-sm text-muted-foreground">
        <span className="font-mono font-semibold text-foreground">{files.length}</span>{" "}
        Seite{files.length !== 1 ? "n" : ""} — eine Prüfung
      </div>

      <Card>
        <CardContent className="p-5">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="exam-subject">Fach *</Label>
                <Select
                  id="exam-subject"
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  required
                >
                  {subjects.length === 0
                    ? <option value="">Kein Fach vorhanden</option>
                    : subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exam-teacher">
                  Lehrer <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Select
                  id="exam-teacher"
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                >
                  <option value="">Kein Lehrer</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exam-date">
                  Datum der Prüfung{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="exam-date"
                  type="date"
                  value={dateOfExam}
                  onChange={(e) => setDateOfExam(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={pending || subjects.length === 0}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {pending ? <Loader2 className="animate-spin" /> : <Upload className="size-4" />}
              Prüfung hochladen & analysieren
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ProcessingStep({
  label,
  done,
  active,
}: {
  label: string;
  done: boolean;
  active?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2", done && "text-emerald-600 dark:text-emerald-400")}>
      {done ? (
        <CheckCircle2 className="size-4 shrink-0" />
      ) : active ? (
        <Loader2 className="size-4 shrink-0 animate-spin text-violet-500" />
      ) : (
        <div className="size-4 shrink-0 rounded-full border border-current opacity-30" />
      )}
      <span className={cn("text-sm", !done && !active && "opacity-40")}>{label}</span>
    </div>
  );
}
