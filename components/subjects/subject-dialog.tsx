"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { cn } from "@/lib/utils";
import { createSubject, updateSubject } from "@/actions/subjects";
import { SUBJECT_COLORS, type Subject, type SubjectColor } from "@/types/domain";
import { SUBJECT_COLOR_CLASSES } from "@/lib/subject-colors";

/**
 * Create or edit a subject (name + colour). Pass `subject` to edit; omit it to
 * create. The trigger is supplied by the caller so it fits any layout.
 */
export function SubjectDialog({
  trigger,
  subject,
}: {
  trigger: React.ReactNode;
  subject?: Subject;
}) {
  const router = useRouter();
  const editing = Boolean(subject);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(subject?.name ?? "");
  const [color, setColor] = useState<SubjectColor>(subject?.color ?? "slate");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setName(subject?.name ?? "");
    setColor(subject?.color ?? "slate");
    setError(null);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = editing
        ? await updateSubject({ id: subject!.id, name, color })
        : await createSubject({ name, color });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setOpen(false);
      if (!editing) setName("");
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit subject" : "New subject"}</DialogTitle>
          <DialogDescription>
            A subject holds your documents and powers AI study tools.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="subject-name">Name</Label>
            <Input
              id="subject-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mathematics"
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Colour</Label>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={SUBJECT_COLOR_CLASSES[c].label}
                  onClick={() => setColor(c)}
                  className={cn(
                    "size-7 rounded-full ring-2 ring-offset-2 transition",
                    SUBJECT_COLOR_CLASSES[c].dot,
                    color === c ? "ring-ring" : "ring-transparent"
                  )}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : editing ? "Save changes" : "Create subject"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
