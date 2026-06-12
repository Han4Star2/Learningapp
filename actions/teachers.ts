"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

type Result = { ok: true } | { error: string };

export async function createTeacher(input: { name: string }): Promise<Result> {
  const name = input.name.trim();
  if (!name) return { error: "Name is required." };

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("teachers")
    .insert({ user_id: user.id, name });
  if (error) return { error: error.message };

  revalidatePath("/", "layout"); // teachers are global — used across subjects
  return { ok: true };
}

export async function updateTeacher(input: {
  id: string;
  name: string;
}): Promise<Result> {
  const name = input.name.trim();
  if (!input.id || !name) return { error: "Name is required." };

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("teachers")
    .update({ name })
    .eq("id", input.id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteTeacher(id: string): Promise<void> {
  if (!id) return;
  const { supabase } = await requireUser();
  await supabase.from("teachers").delete().eq("id", id);
  revalidatePath("/", "layout");
}
