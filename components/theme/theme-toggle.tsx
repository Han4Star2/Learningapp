"use client";

import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme, type ColorTheme } from "./theme-provider";

const COLOR_META: { key: ColorTheme; label: string; cls: string }[] = [
  { key: "blue",   label: "Blue",   cls: "bg-blue-500" },
  { key: "purple", label: "Purple", cls: "bg-purple-500" },
  { key: "green",  label: "Green",  cls: "bg-emerald-500" },
  { key: "orange", label: "Orange", cls: "bg-orange-500" },
];

export function ThemeControls({ compact = false }: { compact?: boolean }) {
  const { mode, setMode, colorTheme, setColorTheme } = useTheme();
  const isDark = mode === "dark";

  return (
    <div className={cn("flex items-center gap-2", compact && "gap-1.5")}>
      {/* Light / Dark toggle */}
      <button
        type="button"
        onClick={() => setMode(isDark ? "light" : "dark")}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className={cn(
          "flex size-7 items-center justify-center rounded-md transition-colors",
          "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>

      {/* Colour theme dots */}
      <div className="flex items-center gap-1">
        {COLOR_META.map(({ key, label, cls }) => (
          <button
            key={key}
            type="button"
            onClick={() => setColorTheme(key)}
            aria-label={`${label} theme`}
            className={cn(
              "size-4 rounded-full ring-2 ring-offset-1 ring-offset-sidebar transition-all",
              cls,
              colorTheme === key ? "ring-foreground/40 scale-110" : "ring-transparent"
            )}
          />
        ))}
      </div>
    </div>
  );
}
