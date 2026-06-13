"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, LogOut, GraduationCap, Upload,
  Settings, X, Sun, Moon, Check, Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SUBJECT_COLOR_CLASSES } from "@/lib/subject-colors";
import { useTheme, type ColorTheme } from "@/components/theme/theme-provider";
import { useLang } from "@/lib/i18n/context";
import type { Subject } from "@/types/domain";

// ── Nav item ──────────────────────────────────────────────────────────────────

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

// ── Color accent options ───────────────────────────────────────────────────────

const COLOR_OPTIONS: { key: ColorTheme; dot: string; labelKey: "colorBlue" | "colorPurple" | "colorGreen" | "colorOrange" }[] = [
  { key: "blue",   dot: "bg-blue-500",    labelKey: "colorBlue" },
  { key: "purple", dot: "bg-purple-500",  labelKey: "colorPurple" },
  { key: "green",  dot: "bg-emerald-500", labelKey: "colorGreen" },
  { key: "orange", dot: "bg-orange-500",  labelKey: "colorOrange" },
];

// ── Settings panel ────────────────────────────────────────────────────────────

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { mode, setMode, colorTheme, setColorTheme } = useTheme();
  const { lang, setLang, t } = useLang();

  return (
    <div
      className="border-t border-sidebar-border bg-sidebar px-4 py-4 space-y-5"
      style={{ animation: "slide-up 0.2s cubic-bezier(0.4,0,0.2,1) forwards" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground/70">
          {t("settings")}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="flex size-5 items-center justify-center rounded text-muted-foreground/50 hover:text-foreground transition-colors"
          aria-label="Close settings"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Language */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground/50">
          {t("language")}
        </p>
        <div className="flex gap-1.5">
          {(["de", "en"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-all duration-150",
                lang === l
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-border/80 hover:bg-accent"
              )}
            >
              {lang === l && <Check className="size-3" />}
              {l === "de" ? "Deutsch" : "English"}
            </button>
          ))}
        </div>
      </div>

      {/* Light / Dark */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground/50">
          {t("appearance")}
        </p>
        <div className="flex gap-1.5">
          {([
            { value: "light", icon: Sun,  label: t("light") },
            { value: "dark",  icon: Moon, label: t("dark")  },
          ] as const).map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md border py-1.5 text-xs font-medium transition-all duration-150",
                mode === value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              <Icon className="size-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Color accent */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground/50">
          {t("color")}
        </p>
        <div className="flex gap-2">
          {COLOR_OPTIONS.map(({ key, dot, labelKey }) => (
            <button
              key={key}
              type="button"
              onClick={() => setColorTheme(key)}
              aria-label={t(labelKey)}
              title={t(labelKey)}
              className={cn(
                "size-6 rounded-full ring-2 ring-offset-2 ring-offset-sidebar transition-all duration-150",
                dot,
                colorTheme === key
                  ? "ring-foreground/50 scale-110"
                  : "ring-transparent hover:scale-110"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

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
  const { t } = useLang();
  const [settingsOpen, setSettingsOpen] = useState(false);

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
        <NavItem href="/dashboard" active={pathname === "/dashboard"} icon={LayoutDashboard} onClick={onClose}>
          {t("dashboard")}
        </NavItem>
        <NavItem href="/upload" active={pathname === "/upload"} icon={Upload} onClick={onClose}>
          {t("upload")}
        </NavItem>
        <NavItem href="/create" active={pathname === "/create"} icon={Wand2} onClick={onClose}>
          {t("create")}
        </NavItem>
        <NavItem href="/teachers" active={pathname === "/teachers"} icon={Users} onClick={onClose}>
          {t("teachers")}
        </NavItem>

        {subjects.length > 0 && (
          <div className="mt-4">
            <p className="mb-1 px-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {t("subjects")}
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
                    <span className={cn("size-2 shrink-0 rounded-full transition-all duration-300", color.dot, active && "scale-125")} />
                    <span className="truncate">{s.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* ── Settings panel (slides up above footer) ──────── */}
      {settingsOpen && (
        <SettingsPanel onClose={() => setSettingsOpen(false)} />
      )}

      {/* ── Footer ───────────────────────────────────────── */}
      <div className="shrink-0 border-t border-sidebar-border p-3 space-y-0.5">
        {/* Profile row — opens settings */}
        <button
          type="button"
          onClick={() => setSettingsOpen((v) => !v)}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 transition-all duration-200",
            settingsOpen
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <div className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
            settingsOpen ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary"
          )}>
            {email.charAt(0).toUpperCase()}
          </div>
          <p className="flex-1 truncate text-xs text-left">{email}</p>
          <Settings className={cn("size-3.5 shrink-0 transition-transform duration-200", settingsOpen && "rotate-45")} />
        </button>

        {/* Logout */}
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground/70 transition-all duration-200 hover:bg-accent hover:text-destructive hover:translate-x-0.5"
          >
            <LogOut className="size-4" />
            {t("logout")}
          </button>
        </form>
      </div>
    </aside>
  );
}
