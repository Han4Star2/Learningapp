"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import type { FormState } from "@/types/domain";

export async function createSchoolYear(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("school_years")
    .insert({ user_id: user.id, name });
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateSchoolYear(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id) return { error: "Missing school year id." };
  if (!name) return { error: "Name is required." };

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("school_years")
    .update({ name })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/years/${id}`);
  redirect(`/dashboard/years/${id}`);
}

export async function deleteSchoolYear(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { supabase } = await requireUser();
  await supabase.from("school_years").delete().eq("id", id);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
