"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, StickyNote, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteNote } from "@/actions/notes";
import type { Note } from "@/types/domain";

export function NotesList({
  subjectId,
  notes,
}: {
  subjectId: string;
  notes: Note[];
}) {
  const router = useRouter();

  if (notes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No notes yet — upload a scan or paste text to get started.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {notes.map((note) => (
        <NoteRow
          key={note.id}
          note={note}
          subjectId={subjectId}
          onDeleted={() => router.refresh()}
        />
      ))}
    </ul>
  );
}

function NoteRow({
  note,
  subjectId,
  onDeleted,
}: {
  note: Note;
  subjectId: string;
  onDeleted: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteNote(note.id, subjectId);
      toast.success("Note deleted.");
      onDeleted();
    });
  }

  return (
    <li className="group relative">
      <Card>
        <CardContent className="flex items-start gap-4 p-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <StickyNote className="size-4" />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {note.note_date && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="size-3" />
                  {new Date(note.note_date).toLocaleDateString()}
                </div>
              )}
              {note.file_url && (
                <Badge variant="secondary" className="text-[10px]">File attached</Badge>
              )}
            </div>
            {note.extracted_text && (
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {note.extracted_text}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground/60">
              Added {new Date(note.created_at).toLocaleDateString()}
            </p>
          </div>

          <ConfirmDialog
            title="Delete note"
            description="This permanently removes the note and its file."
            onConfirm={handleDelete}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-destructive/60 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                disabled={pending}
                aria-label="Delete note"
                onClick={(e) => e.preventDefault()}
              >
                <Trash2 className="size-4" />
              </Button>
            }
          />
        </CardContent>
      </Card>
    </li>
  );
}
