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
import { createTeacher, updateTeacher } from "@/actions/teachers";
import type { Teacher } from "@/types/domain";

/**
 * Create or rename a teacher. Teachers are global — reusable across every
 * subject. Pass `teacher` to rename; omit to create.
 */
export function TeacherDialog({
  trigger,
  teacher,
}: {
  trigger: React.ReactNode;
  teacher?: Teacher;
}) {
  const router = useRouter();
  const editing = Boolean(teacher);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(teacher?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = editing
        ? await updateTeacher({ id: teacher!.id, name })
        : await createTeacher({ name });
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
        if (!v) {
          setName(teacher?.name ?? "");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Rename teacher" : "New teacher"}</DialogTitle>
          <DialogDescription>
            Tag past exams with a teacher and the AI imitates their style across
            every subject they teach.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="teacher-name">Name</Label>
            <Input
              id="teacher-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mr. Smith"
              autoFocus
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : editing ? "Save changes" : "Create teacher"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
