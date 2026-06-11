"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import type { FormState } from "@/types/domain";

export async function createSubject(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const schoolYearId = String(formData.get("school_year_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!schoolYearId) return { error: "Missing school year id." };
  if (!name) return { error: "Name is required." };

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("subjects")
    .insert({ user_id: user.id, school_year_id: schoolYearId, name });
  if (error) return { error: error.message };

  revalidatePath(`/dashboard/years/${schoolYearId}`);
  redirect(`/dashboard/years/${schoolYearId}`);
}

export async function updateSubject(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const schoolYearId = String(formData.get("school_year_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id) return { error: "Missing subject id." };
  if (!name) return { error: "Name is required." };

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("subjects")
    .update({ name })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/dashboard/years/${schoolYearId}`);
  redirect(`/dashboard/years/${schoolYearId}`);
}

export async function deleteSubject(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const schoolYearId = String(formData.get("school_year_id") ?? "");
  if (!id) return;

  const { supabase } = await requireUser();
  await supabase.from("subjects").delete().eq("id", id);

  revalidatePath(`/dashboard/years/${schoolYearId}`);
  redirect(`/dashboard/years/${schoolYearId}`);
}
