import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/actions/auth";
import { Sidebar } from "@/components/shell/sidebar";
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
  if (!user) redirect("/login"); // middleware guards too; defense in depth

  const { data } = await supabase
    .from("subjects")
    .select("*")
    .order("created_at", { ascending: true });
  const subjects = (data ?? []) as Subject[];

  return (
    <div className="flex min-h-screen">
      <Sidebar subjects={subjects} email={user.email ?? ""} logout={logout} />

      <div className="flex-1">
        {/* Compact top bar for small screens (sidebar hidden) */}
        <header className="border-b border-gray-200 bg-white px-4 py-3 md:hidden">
          <Link href="/dashboard" className="font-semibold">
            StudyAI
          </Link>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
      </div>
    </div>
  );
}
