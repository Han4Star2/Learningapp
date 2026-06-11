"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import type { FormState } from "@/types/domain";

export async function createSubject(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("subjects")
    .insert({ user_id: user.id, name });
  if (error) return { error: error.message };

  revalidatePath("/", "layout"); // sidebar lists subjects everywhere
}

export async function renameSubject(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return { error: "Name is required." };

  const { supabase } = await requireUser();
  const { error } = await supabase.from("subjects").update({ name }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
}

export async function deleteSubject(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { supabase } = await requireUser();
  await supabase.from("subjects").delete().eq("id", id);

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
