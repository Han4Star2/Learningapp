"use server";

import { requireUser } from "@/lib/auth";
import type { Grade, GradeStats } from "@/types/domain";

export async function addGrade(input: {
  subjectId: string;
  gradeValue: number;
  maxValue?: number;
  label?: string;
}): Promise<Grade | { error: string }> {
  if (!input.subjectId) return { error: "Subject ID is required." };
  if (input.gradeValue == null) return { error: "Grade value is required." };

  const maxValue = input.maxValue ?? 100;

  if (input.gradeValue < 0 || input.gradeValue > maxValue) {
    return { error: `Grade must be between 0 and ${maxValue}.` };
  }

  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("grades")
    .insert({
      user_id: user.id,
      subject_id: input.subjectId,
      grade_value: input.gradeValue,
      max_value: maxValue,
      label: input.label?.trim() || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  const grade = data as Grade;

  // Fire-and-forget: create alert notifications for significant grade events
  void createGradeAlerts(supabase, user.id, input.subjectId, grade);

  return grade;
}

export async function deleteGrade(
  id: string
): Promise<{ ok: true } | { error: string }> {
  if (!id) return { error: "Grade ID is required." };

  const { supabase } = await requireUser();

  const { error } = await supabase.from("grades").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function getSubjectGradeStats(
  subjectId: string
): Promise<GradeStats | { error: string }> {
  if (!subjectId) return { error: "Subject ID is required." };

  const { supabase } = await requireUser();

  const { data, error } = await supabase
    .from("grades")
    .select("*")
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };

  const rows = (data ?? []) as Grade[];
  if (rows.length === 0) {
    return {
      count: 0,
      average: 0,
      highest: 0,
      lowest: 0,
      trend: null,
      recent: [],
    };
  }

  const percentages = rows.map((r) => (r.grade_value / r.max_value) * 100);
  const average = percentages.reduce((a, b) => a + b, 0) / percentages.length;
  const highest = Math.max(...percentages);
  const lowest = Math.min(...percentages);

  let trend: GradeStats["trend"] = "stable";
  if (rows.length >= 3) {
    const recent3 = percentages.slice(-3);
    const diffs = recent3.slice(1).map((v, i) => v - recent3[i]);
    const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    if (avgDiff > 2) trend = "improving";
    else if (avgDiff < -2) trend = "declining";
  }

  return {
    count: rows.length,
    average: Math.round(average * 10) / 10,
    highest: Math.round(highest * 10) / 10,
    lowest: Math.round(lowest * 10) / 10,
    trend,
    recent: rows.slice(-5).reverse(),
  };
}

// ── Internal helpers ──────────────────────────────────────────────────────────

async function createGradeAlerts(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  userId: string,
  subjectId: string,
  newGrade: Grade
) {
  const { data: rows } = await supabase
    .from("grades")
    .select("grade_value, max_value")
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: false })
    .limit(6);

  if (!rows || rows.length < 2) return;

  const pct = (r: { grade_value: number; max_value: number }) =>
    (r.grade_value / r.max_value) * 100;

  const newPct = pct(newGrade);
  const prev = rows.slice(1); // exclude the one we just inserted (it's at rows[0])
  const prevAvg = prev.reduce((a, r) => a + pct(r), 0) / prev.length;

  const notifications: { user_id: string; type: string; message: string }[] = [];

  if (newPct < 50) {
    notifications.push({
      user_id: userId,
      type: "exam_risk",
      message: `You scored ${newPct.toFixed(0)}% — below 50%. Review this subject to avoid falling behind.`,
    });
  } else if (newPct - prevAvg >= 10) {
    notifications.push({
      user_id: userId,
      type: "grade_improvement",
      message: `Your grade improved by ${(newPct - prevAvg).toFixed(0)} percentage points. Keep it up!`,
    });
  } else if (prevAvg - newPct >= 10) {
    notifications.push({
      user_id: userId,
      type: "grade_drop",
      message: `Your grade dropped by ${(prevAvg - newPct).toFixed(0)} percentage points. Consider reviewing the material.`,
    });
  }

  if (notifications.length > 0) {
    await supabase.from("notifications").insert(notifications);
  }
}
