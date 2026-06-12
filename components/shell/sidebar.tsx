"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, LogOut, GraduationCap, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUBJECT_COLOR_CLASSES } from "@/lib/subject-colors";
import { ThemeControls } from "@/components/theme/theme-toggle";
import type { Subject } from "@/types/domain";

function NavItem({
  href,
  active,
  icon: Icon,
  children,
  onClick,
}: {
  href: string;
  active: boolean;
  icon: React.ElementType;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-all duration-200",
        active
          ? "bg-primary/10 text-primary"
          : "text-sidebar-foreground/70 hover:bg-accent/80 hover:text-sidebar-foreground hover:translate-x-0.5"
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          active ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"
        )}
      />
      {children}
    </Link>
  );
}

export function Sidebar({
  subjects,
  email,
  logout,
  onClose,
}: {
  subjects: Subject[];
  email: string;
  logout: () => Promise<void>;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar">
      {/* ── Logo ─────────────────────────────────────────── */}
      <div className="flex h-14 shrink-0 items-center gap-2 px-4">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <GraduationCap className="size-4" />
        </div>
        <Link
          href="/dashboard"
          onClick={onClose}
          className="text-sm font-bold tracking-tight text-sidebar-foreground"
        >
          StudyAI
        </Link>
      </div>

      {/* ── Navigation ───────────────────────────────────── */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-2">
        <NavItem
          href="/dashboard"
          active={pathname === "/dashboard"}
          icon={LayoutDashboard}
          onClick={onClose}
        >
          Dashboard
        </NavItem>
        <NavItem
          href="/upload"
          active={pathname === "/upload"}
          icon={Upload}
          onClick={onClose}
        >
          Hochladen
        </NavItem>
        <NavItem
          href="/teachers"
          active={pathname === "/teachers"}
          icon={Users}
          onClick={onClose}
        >
          Teachers
        </NavItem>

        {/* Subjects section */}
        {subjects.length > 0 && (
          <div className="mt-4">
            <p className="mb-1 px-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Subjects
            </p>
            <div className="flex flex-col gap-0.5">
              {subjects.map((s) => {
                const active = pathname.startsWith(`/subjects/${s.id}`);
                const color = SUBJECT_COLOR_CLASSES[s.color];
                return (
                  <Link
                    key={s.id}
                    href={`/subjects/${s.id}`}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-all duration-200",
                      active
                        ? "bg-primary/10 font-medium text-primary"
                        : "font-normal text-sidebar-foreground/70 hover:bg-accent/80 hover:text-sidebar-foreground hover:translate-x-0.5"
                    )}
                  >
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-full transition-all duration-300",
                        color.dot,
                        active && "scale-125"
                      )}
                    />
                    <span className="truncate">{s.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* ── Footer ───────────────────────────────────────── */}
      <div className="shrink-0 space-y-2 border-t border-sidebar-border p-3">
        {/* Theme controls */}
        <div className="flex items-center justify-between px-1.5">
          <span className="text-[11px] text-muted-foreground/60">Theme</span>
          <ThemeControls compact />
        </div>

        {/* User row */}
        <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
            {email.charAt(0).toUpperCase()}
          </div>
          <p className="flex-1 truncate text-xs text-muted-foreground">{email}</p>
        </div>

        {/* Logout */}
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground/70 transition-all duration-200 hover:bg-accent hover:text-destructive hover:translate-x-0.5"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}
