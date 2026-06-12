"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { SUBJECT_COLORS, type SubjectColor } from "@/types/domain";

type Result = { ok: true } | { error: string };

function normalizeColor(value: unknown): SubjectColor {
  return SUBJECT_COLORS.includes(value as SubjectColor)
    ? (value as SubjectColor)
    : "slate";
}

export async function createSubject(input: {
  name: string;
  color: string;
}): Promise<Result> {
  const name = input.name.trim();
  if (!name) return { error: "Name is required." };

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("subjects")
    .insert({ user_id: user.id, name, color: normalizeColor(input.color) });
  if (error) return { error: error.message };

  revalidatePath("/", "layout"); // sidebar + dashboard list everywhere
  return { ok: true };
}

export async function updateSubject(input: {
  id: string;
  name: string;
  color: string;
}): Promise<Result> {
  const name = input.name.trim();
  if (!input.id || !name) return { error: "Name is required." };

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("subjects")
    .update({ name, color: normalizeColor(input.color) })
    .eq("id", input.id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteSubject(id: string): Promise<void> {
  if (!id) return;
  const { supabase } = await requireUser();
  await supabase.from("subjects").delete().eq("id", id);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
