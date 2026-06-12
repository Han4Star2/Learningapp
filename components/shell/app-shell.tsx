"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";
import type { Subject } from "@/types/domain";

export function AppShell({
  children,
  subjects,
  email,
  logout,
}: {
  children: React.ReactNode;
  subjects: Subject[];
  email: string;
  logout: () => Promise<void>;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (escape key too)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSidebarOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Mobile backdrop ─────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────── */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 md:static md:z-auto md:flex",
          "transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <Sidebar
          subjects={subjects}
          email={email}
          logout={logout}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* ── Main area ───────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-sm md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle navigation"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <span className="text-sm font-semibold tracking-tight">StudyAI</span>
        </header>

        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 animate-slide-up">
          {children}
        </main>
      </div>
    </div>
  );
}
