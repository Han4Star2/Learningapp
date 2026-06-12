"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SUBJECT_COLOR_CLASSES } from "@/lib/subject-colors";
import type { Subject } from "@/types/domain";

export function Sidebar({
  subjects,
  email,
  logout,
}: {
  subjects: Subject[];
  email: string;
  logout: () => Promise<void>;
}) {
  const pathname = usePathname();

  const linkClass = (active: boolean) =>
    cn(
      "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
      active
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    );

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r bg-card max-md:hidden">
      <div className="px-5 py-4">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          StudyAI
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        <Link href="/dashboard" className={linkClass(pathname === "/dashboard")}>
          <LayoutDashboard className="size-4" />
          Dashboard
        </Link>
        <Link href="/teachers" className={linkClass(pathname === "/teachers")}>
          <Users className="size-4" />
          Teachers
        </Link>

        <p className="px-3 pb-1 pt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Subjects
        </p>
        {subjects.length === 0 ? (
          <p className="px-3 text-sm text-muted-foreground">None yet</p>
        ) : (
          subjects.map((s) => {
            const active = pathname.startsWith(`/subjects/${s.id}`);
            return (
              <Link key={s.id} href={`/subjects/${s.id}`} className={linkClass(active)}>
                <span
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    SUBJECT_COLOR_CLASSES[s.color].dot
                  )}
                />
                <span className="truncate">{s.name}</span>
              </Link>
            );
          })
        )}
      </nav>

      <div className="border-t p-3">
        <p className="truncate px-1 pb-2 text-xs text-muted-foreground">{email}</p>
        <form action={logout}>
          <Button variant="ghost" type="submit" className="w-full justify-start">
            <LogOut className="size-4" />
            Log out
          </Button>
        </form>
      </div>
    </aside>
  );
}
