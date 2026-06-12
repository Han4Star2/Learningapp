"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BrainCircuit,
  Loader2,
  ChevronDown,
  ChevronUp,
  Target,
  TrendingUp,
  BookOpen,
  AlertTriangle,
  FolderOpen,
  Upload,
  Globe,
} from "lucide-react";
import {
  predictExam,
  type ExamPrediction,
  type PredictExamInput,
} from "@/actions/predict-exam";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Subject, Teacher } from "@/types/domain";

const CONFIDENCE_BAR: Record<ExamPrediction["predicted_questions"][number]["confidence"], string> = {
  high:   "bg-emerald-500",
  medium: "bg-amber-400",
  low:    "bg-rose-500",
};
const CONFIDENCE_BADGE: Record<ExamPrediction["predicted_questions"][number]["confidence"], string> = {
  high:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  low:    "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};
const CONFIDENCE_WIDTH = { high: "90%", medium: "55%", low: "22%" } as const;

export function ExamPredictor({
  subjects,
  teachers,
}: {
  subjects: Subject[];
  teachers: Teacher[];
}) {
  const router = useRouter();

  const [subjectId, setSubjectId]           = useState(subjects[0]?.id ?? "");
  const [teacherId, setTeacherId]           = useState(teachers[0]?.id ?? "");
  const [topicOverride, setTopicOverride]   = useState("");
  const [examDate, setExamDate]             = useState("");
  const [result, setResult]                 = useState<ExamPrediction | null>(null);
  const [missingTopics, setMissingTopics]   = useState<string[] | null>(null);
  const [error, setError]                   = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen]       = useState(false);
  const [pending, startTransition]          = useTransition();

  const noSubjects = subjects.length === 0;
  const noTeachers = teachers.length === 0;

  function run(input: PredictExamInput) {
    setError(null);
    setResult(null);
    setMissingTopics(null);
    setSummaryOpen(false);
    startTransition(async () => {
      const res = await predictExam(input);
      if ("error" in res) {
        setError(res.error);
      } else if ("needs_material" in res) {
        setMissingTopics(res.missingTopics);
      } else {
        setResult(res);
      }
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subjectId || !teacherId) return;
    run({ subjectId, teacherId, topicOverride: topicOverride.trim() || undefined, examDate: examDate || undefined });
  }

  function onWebFallback() {
    run({
      subjectId,
      teacherId,
      topicOverride: topicOverride.trim() || undefined,
      examDate: examDate || undefined,
      webSearchFallback: true,
    });
  }

  return (
    <section className="space-y-5">
      {/* Heading */}
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
          <BrainCircuit className="size-4" />
        </div>
        <div>
          <h2 className="text-lg font-semibold leading-tight">KI Prüfungs-Vorhersage</h2>
          <p className="text-xs text-muted-foreground">
            Analysiert Lehrermuster und Unterlagen, um wahrscheinliche Prüfungsfragen vorherzusagen.
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="p-5">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pred-subject">Fach</Label>
                <Select
                  id="pred-subject"
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  disabled={pending || noSubjects}
                  required
                >
                  {noSubjects
                    ? <option value="">Kein Fach vorhanden</option>
                    : subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pred-teacher">Lehrer</Label>
                <Select
                  id="pred-teacher"
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  disabled={pending || noTeachers}
                  required
                >
                  {noTeachers
                    ? <option value="">Kein Lehrer vorhanden</option>
                    : teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pred-topics">
                  Thema{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="pred-topics"
                  placeholder="z.B. Quadratische Gleichungen, Lineare Funktionen"
                  value={topicOverride}
                  onChange={(e) => {
                    setTopicOverride(e.target.value);
                    setMissingTopics(null);
                  }}
                  disabled={pending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pred-date">
                  Prüfungsdatum{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="pred-date"
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  disabled={pending}
                />
              </div>
            </div>

            {(noSubjects || noTeachers) && (
              <p className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                <AlertTriangle className="size-3.5 shrink-0" />
                {noSubjects
                  ? "Erstelle zuerst ein Fach und lade Unterlagen hoch."
                  : "Füge zuerst einen Lehrer hinzu, damit die KI seine Muster analysieren kann."}
              </p>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={pending || noSubjects || noTeachers}>
                {pending ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Analysiere…
                  </>
                ) : (
                  <>
                    <BrainCircuit />
                    Vorhersage generieren
                  </>
                )}
              </Button>
              {pending && (
                <p className="animate-pulse text-sm text-muted-foreground">
                  Lehrermuster lesen — 20–40 s
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Loading skeleton */}
      {pending && <PredictionSkeleton />}

      {/* Missing material prompt */}
      {missingTopics && !pending && (
        <MissingMaterialCard
          topics={missingTopics}
          onUpload={() => router.push("/upload")}
          onSkip={onWebFallback}
        />
      )}

      {/* Results */}
      {result && !pending && (
        <PredictionResults
          result={result}
          summaryOpen={summaryOpen}
          onToggleSummary={() => setSummaryOpen((v) => !v)}
        />
      )}
    </section>
  );
}

// ── Missing material card ─────────────────────────────────────────────────────

function MissingMaterialCard({
  topics,
  onUpload,
  onSkip,
}: {
  topics: string[];
  onUpload: () => void;
  onSkip: () => void;
}) {
  return (
    <Card
      className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
      style={{ animation: "slide-up 0.3s cubic-bezier(0.4,0,0.2,1) forwards" }}
    >
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <FolderOpen className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1.5">
            <p className="font-semibold text-sm text-amber-900 dark:text-amber-200">
              Keine Unterlagen für diese Themen gefunden
            </p>
            <p className="text-sm text-amber-800/80 dark:text-amber-300/80">
              Für{" "}
              <span className="font-medium">
                {topics.join(", ")}
              </span>{" "}
              sind keine Arbeitsblätter oder Notizen hochgeladen. Hast du etwas dazu?
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {topics.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            onClick={onUpload}
            size="sm"
            className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600"
          >
            <Upload className="size-3.5" />
            Jetzt hochladen
          </Button>
          <Button
            onClick={onSkip}
            size="sm"
            variant="outline"
            className="border-amber-400 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30"
          >
            <Globe className="size-3.5" />
            Überspringen — KI sucht selbst
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function PredictionSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-12 rounded-xl bg-muted" />
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-4 w-full rounded bg-muted" />
            <div className="flex gap-2 pt-1">
              <div className="h-5 w-16 rounded-full bg-muted" />
              <div className="h-5 w-20 rounded-full bg-muted" />
              <div className="h-5 w-24 rounded-full bg-muted" />
            </div>
            <div className="h-1 w-full rounded-full bg-muted" />
            <div className="h-3 w-2/3 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Results ───────────────────────────────────────────────────────────────────

function PredictionResults({
  result,
  summaryOpen,
  onToggleSummary,
}: {
  result: ExamPrediction;
  summaryOpen: boolean;
  onToggleSummary: () => void;
}) {
  return (
    <div
      className="space-y-5"
      style={{ animation: "slide-up 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards" }}
    >
      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Target className="size-4 text-muted-foreground" />
            Vorhersage-Konfidenz
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  result.confidence_score >= 70 ? "bg-emerald-500"
                  : result.confidence_score >= 45 ? "bg-amber-400"
                  : "bg-rose-500"
                )}
                style={{ width: `${result.confidence_score}%` }}
              />
            </div>
            <span className="w-9 text-right text-sm font-bold tabular-nums">
              {result.confidence_score}%
            </span>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <BrainCircuit className="size-4 text-violet-500" />
          Vorhergesagte Fragen
          <Badge variant="secondary" className="ml-1">
            {result.predicted_questions.length}
          </Badge>
        </h3>
        <div className="space-y-3">
          {result.predicted_questions.map((q, i) => (
            <QuestionCard key={i} q={q} index={i} />
          ))}
        </div>
      </section>

      {result.likely_topics.length > 0 && (
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="size-4 text-blue-500" />
            Wahrscheinliche Themen
          </h3>
          <Card>
            <CardContent className="space-y-4 p-5">
              {[...result.likely_topics]
                .sort((a, b) => b.weight - a.weight)
                .map((t, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium">{t.topic}</span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {Math.round(t.weight * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          t.weight >= 0.5 ? "bg-violet-500"
                          : t.weight >= 0.25 ? "bg-blue-400"
                          : "bg-slate-400"
                        )}
                        style={{ width: `${Math.round(t.weight * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{t.evidence}</p>
                  </div>
                ))}
            </CardContent>
          </Card>
        </section>
      )}

      <section>
        <button
          type="button"
          onClick={onToggleSummary}
          className="flex w-full items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors hover:bg-accent"
        >
          <span className="flex items-center gap-2">
            <BookOpen className="size-4 text-muted-foreground" />
            Begründung
          </span>
          {summaryOpen
            ? <ChevronUp className="size-4 text-muted-foreground" />
            : <ChevronDown className="size-4 text-muted-foreground" />}
        </button>
        {summaryOpen && (
          <Card className="mt-2 border-t-0 rounded-t-none">
            <CardContent className="p-4 text-sm leading-relaxed text-muted-foreground">
              {result.reasoning_summary}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function QuestionCard({
  q,
  index,
}: {
  q: ExamPrediction["predicted_questions"][number];
  index: number;
}) {
  return (
    <Card
      style={{
        animation: "slide-up 0.3s cubic-bezier(0.4,0,0.2,1) forwards",
        animationDelay: `${index * 60}ms`,
        opacity: 0,
      }}
    >
      <CardContent className="space-y-3 p-4">
        <p className="text-sm font-medium leading-relaxed">{q.question}</p>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">{q.topic}</Badge>
          <Badge variant="secondary" className="text-xs">
            {q.likely_marks} Punkt{q.likely_marks !== 1 ? "e" : ""}
          </Badge>
          <span className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            CONFIDENCE_BADGE[q.confidence]
          )}>
            {q.confidence === "high" ? "hohe" : q.confidence === "medium" ? "mittlere" : "niedrige"} Konfidenz
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                CONFIDENCE_BAR[q.confidence]
              )}
              style={{ width: CONFIDENCE_WIDTH[q.confidence] }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{q.reasoning}</p>
        </div>
      </CardContent>
    </Card>
  );
}
