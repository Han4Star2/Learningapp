"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload, X, Loader2, AlertTriangle, CheckCircle2, ArrowLeft,
} from "lucide-react";
import { uploadFile } from "@/lib/storage";
import { processAndSaveNote } from "@/actions/process-note-images";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Subject } from "@/types/domain";

type NoteStatus = "pending" | "uploading" | "processing" | "done" | "error";

type NoteItem = {
  file: File;
  preview: string;
  subjectId: string;
  noteDate: string;
  status: NoteStatus;
  error?: string;
};

export function NotesUploader({
  subjects,
  onBack,
}: {
  subjects: Subject[];
  onBack: () => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const defaultSubjectId = subjects[0]?.id ?? "";

  const [items, setItems] = useState<NoteItem[]>([]);
  const [running, setRunning] = useState(false);
  const [allDone, setAllDone] = useState(false);

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    const imgs = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    const newItems: NoteItem[] = imgs.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      subjectId: defaultSubjectId,
      noteDate: "",
      status: "pending",
    }));
    setItems((prev) => [...prev, ...newItems]);
  }

  function removeItem(idx: number) {
    URL.revokeObjectURL(items[idx].preview);
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, patch: Partial<Pick<NoteItem, "subjectId" | "noteDate">>) {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, ...patch } : item))
    );
  }

  async function processAll() {
    if (items.length === 0) return;
    setRunning(true);

    // Process in parallel (but update status per item)
    await Promise.all(
      items.map(async (item, idx) => {
        if (item.status !== "pending") return;

        setItems((prev) =>
          prev.map((it, i) => (i === idx ? { ...it, status: "uploading" } : it))
        );

        const uploaded = await uploadFile(item.file);
        if ("error" in uploaded) {
          setItems((prev) =>
            prev.map((it, i) =>
              i === idx ? { ...it, status: "error", error: uploaded.error } : it
            )
          );
          return;
        }

        setItems((prev) =>
          prev.map((it, i) => (i === idx ? { ...it, status: "processing" } : it))
        );

        const saved = await processAndSaveNote({
          subjectId: item.subjectId,
          noteDate: item.noteDate || null,
          path: uploaded.path,
        });

        setItems((prev) =>
          prev.map((it, i) =>
            i === idx
              ? {
                  ...it,
                  status: "error" in saved ? "error" : "done",
                  error: "error" in saved ? saved.error : undefined,
                }
              : it
          )
        );
      })
    );

    setRunning(false);
    setAllDone(true);
    router.refresh();
  }

  const doneCount = items.filter((it) => it.status === "done").length;
  const errorCount = items.filter((it) => it.status === "error").length;

  // ── Render ──────────────────────────────────────────────────────────────────

  if (allDone) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
          <CheckCircle2 className="size-7" />
        </div>
        <div>
          <p className="text-lg font-semibold">
            {doneCount} Eintrag{doneCount !== 1 ? "träge" : ""} gespeichert
          </p>
          {errorCount > 0 && (
            <p className="mt-1 text-sm text-destructive">
              {errorCount} Fehler — betroffene Bilder erneut versuchen
            </p>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="size-4" /> Weitere hochladen
          </Button>
          {subjects[0] && (
            <Button onClick={() => router.push(`/subjects/${subjects[0].id}/notes`)}>
              Hefteinträge ansehen
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" /> Zurück
      </button>

      {/* Drop zone */}
      {!running && (
        <div
          onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200",
            "border-border hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20",
            items.length > 0 && "py-6"
          )}
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30">
            <Upload className="size-5" />
          </div>
          <div>
            <p className="font-semibold text-sm">Bilder hierher ziehen</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Jedes Bild wird ein separater Hefteintrag
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
      )}

      {/* Per-image metadata */}
      {items.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            <span className="font-mono font-semibold text-foreground">{items.length}</span>{" "}
            Eintrag{items.length !== 1 ? "träge" : ""} — Fach und Datum pro Bild festlegen
          </p>

          {items.map((item, idx) => (
            <Card key={idx} className={cn(
              "overflow-hidden transition-all",
              item.status === "done" && "border-emerald-300 dark:border-emerald-800",
              item.status === "error" && "border-destructive/50",
            )}>
              <CardContent className="p-0">
                <div className="flex gap-0">
                  {/* Thumbnail */}
                  <div className="relative w-24 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.preview}
                      alt={`Bild ${idx + 1}`}
                      className="h-full w-full object-cover"
                      style={{ minHeight: "96px" }}
                    />
                    {/* Status overlay */}
                    {(item.status === "uploading" || item.status === "processing") && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 text-white">
                        <Loader2 className="size-5 animate-spin" />
                        <span className="text-[10px]">
                          {item.status === "uploading" ? "Upload" : "KI"}
                        </span>
                      </div>
                    )}
                    {item.status === "done" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-emerald-600/60">
                        <CheckCircle2 className="size-6 text-white" />
                      </div>
                    )}
                    {item.status === "error" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-destructive/60">
                        <AlertTriangle className="size-6 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Fields */}
                  <div className="flex flex-1 flex-col justify-center gap-3 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor={`note-subject-${idx}`} className="text-xs">Fach</Label>
                        <Select
                          id={`note-subject-${idx}`}
                          value={item.subjectId}
                          onChange={(e) => updateItem(idx, { subjectId: e.target.value })}
                          disabled={running || item.status === "done"}
                          className="h-8 text-xs"
                        >
                          {subjects.length === 0
                            ? <option value="">Kein Fach</option>
                            : subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`note-date-${idx}`} className="text-xs">
                          Datum <span className="text-muted-foreground">(optional)</span>
                        </Label>
                        <Input
                          id={`note-date-${idx}`}
                          type="date"
                          value={item.noteDate}
                          onChange={(e) => updateItem(idx, { noteDate: e.target.value })}
                          disabled={running || item.status === "done"}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    {item.error && (
                      <p className="text-xs text-destructive">{item.error}</p>
                    )}
                  </div>

                  {/* Remove button */}
                  {!running && item.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="flex shrink-0 items-start p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            onClick={processAll}
            disabled={running || items.every((it) => it.status !== "pending") || subjects.length === 0}
          >
            {running ? (
              <>
                <Loader2 className="animate-spin" />
                Wird verarbeitet…
              </>
            ) : (
              <>
                <Upload className="size-4" />
                {items.length} Eintrag{items.length !== 1 ? "träge" : ""} hochladen & analysieren
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
