"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import type { FormState } from "@/types/domain";

export async function createTeacher(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("teachers")
    .insert({ user_id: user.id, name });
  if (error) return { error: error.message };

  revalidatePath("/teachers");
}

export async function deleteTeacher(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { supabase } = await requireUser();
  await supabase.from("teachers").delete().eq("id", id);

  revalidatePath("/teachers");
}
