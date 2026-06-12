"use server";

import { requireUser } from "@/lib/auth";
import type { Notification } from "@/types/domain";

export async function listNotifications(
  limit = 50
): Promise<Notification[] | { error: string }> {
  const { supabase } = await requireUser();

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return { error: error.message };
  return (data ?? []) as Notification[];
}

export async function markAsRead(
  id: string
): Promise<{ ok: true } | { error: string }> {
  if (!id) return { error: "Notification ID is required." };

  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);

  if (error) return { error: error.message };
  return { ok: true };
}

export async function markAllRead(): Promise<{ ok: true } | { error: string }> {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) return { error: error.message };
  return { ok: true };
}

export async function deleteNotification(
  id: string
): Promise<{ ok: true } | { error: string }> {
  if (!id) return { error: "Notification ID is required." };

  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  return { ok: true };
}

export async function getUnreadCount(): Promise<
  { count: number } | { error: string }
> {
  const { supabase, user } = await requireUser();

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) return { error: error.message };
  return { count: count ?? 0 };
}
