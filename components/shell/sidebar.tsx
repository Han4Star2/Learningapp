"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "@/components/clsx";
import { Button } from "@/components/ui";
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
    clsx(
      "block rounded-md px-3 py-2 text-sm transition",
      active
        ? "bg-gray-900 text-white"
        : "text-gray-700 hover:bg-gray-100"
    );

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-gray-200 bg-white max-md:hidden">
      <div className="px-4 py-4">
        <Link href="/dashboard" className="text-lg font-semibold">
          StudyAI
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        <Link href="/dashboard" className={linkClass(pathname === "/dashboard")}>
          Dashboard
        </Link>
        <Link href="/teachers" className={linkClass(pathname === "/teachers")}>
          Teachers
        </Link>

        <p className="px-3 pb-1 pt-4 text-xs font-medium uppercase tracking-wide text-gray-400">
          Subjects
        </p>
        {subjects.length === 0 ? (
          <p className="px-3 text-sm text-gray-400">None yet</p>
        ) : (
          subjects.map((s) => (
            <Link
              key={s.id}
              href={`/subjects/${s.id}`}
              className={linkClass(pathname.startsWith(`/subjects/${s.id}`))}
            >
              {s.name}
            </Link>
          ))
        )}
      </nav>

      <div className="border-t border-gray-200 p-3">
        <p className="truncate px-1 pb-2 text-xs text-gray-500">{email}</p>
        <form action={logout}>
          <Button variant="ghost" type="submit" className="w-full">
            Log out
          </Button>
        </form>
      </div>
    </aside>
  );
}
