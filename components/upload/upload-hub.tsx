"use client";

import { useState } from "react";
import { BookOpen, FileText } from "lucide-react";
import { ExamUploader } from "./exam-uploader";
import { NotesUploader } from "./notes-uploader";
import { cn } from "@/lib/utils";
import type { Subject, Teacher } from "@/types/domain";

type Mode = null | "exam" | "notes";

export function UploadHub({
  subjects,
  teachers,
}: {
  subjects: Subject[];
  teachers: Teacher[];
}) {
  const [mode, setMode] = useState<Mode>(null);

  if (mode === "exam") {
    return (
      <ExamUploader
        subjects={subjects}
        teachers={teachers}
        onBack={() => setMode(null)}
      />
    );
  }

  if (mode === "notes") {
    return (
      <NotesUploader
        subjects={subjects}
        onBack={() => setMode(null)}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Hochladen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Was möchtest du hochladen?
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TypeCard
          onClick={() => setMode("notes")}
          icon={<BookOpen className="size-7" />}
          iconBg="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          borderAccent="hover:border-blue-400"
          title="Hefteinträge"
          description="Mehrere Fotos — jedes Bild wird ein eigener Eintrag mit individuellem Fach und Datum."
          badge="Pro Bild"
          badgeColor="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <TypeCard
          onClick={() => setMode("exam")}
          icon={<FileText className="size-7" />}
          iconBg="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
          borderAccent="hover:border-violet-400"
          title="Prüfung"
          description="Mehrere Fotos einer Prüfung — geteiltes Fach, Lehrer und Datum. Die KI erkennt das Datum automatisch."
          badge="KI-Analyse"
          badgeColor="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
        />
      </div>
    </div>
  );
}

function TypeCard({
  onClick,
  icon,
  iconBg,
  borderAccent,
  title,
  description,
  badge,
  badgeColor,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  iconBg: string;
  borderAccent: string;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-col items-start gap-5 rounded-2xl border-2 bg-card p-8 text-left",
        "transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
        "border-border",
        borderAccent
      )}
    >
      <div className={cn(
        "flex size-14 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110",
        iconBg
      )}>
        {icon}
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black tracking-tight">{title}</span>
          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase", badgeColor)}>
            {badge}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}
