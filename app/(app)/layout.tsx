import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/actions/auth";
import { AppShell } from "@/components/shell/app-shell";
import type { Subject } from "@/types/domain";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("subjects")
    .select("*")
    .order("created_at", { ascending: true });
  const subjects = (data ?? []) as Subject[];

  return (
    <AppShell subjects={subjects} email={user.email ?? ""} logout={logout}>
      {children}
    </AppShell>
  );
}
