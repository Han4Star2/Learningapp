import type { SubjectColor } from "@/types/domain";

/**
 * Static Tailwind class strings per subject colour. They must be written in
 * full (no interpolation) so Tailwind's scanner includes them in the build.
 */
export const SUBJECT_COLOR_CLASSES: Record<
  SubjectColor,
  { dot: string; soft: string; ring: string; label: string }
> = {
  slate: { dot: "bg-slate-500", soft: "bg-slate-100 text-slate-700", ring: "ring-slate-200", label: "Slate" },
  blue: { dot: "bg-blue-500", soft: "bg-blue-100 text-blue-700", ring: "ring-blue-200", label: "Blue" },
  emerald: { dot: "bg-emerald-500", soft: "bg-emerald-100 text-emerald-700", ring: "ring-emerald-200", label: "Emerald" },
  amber: { dot: "bg-amber-500", soft: "bg-amber-100 text-amber-700", ring: "ring-amber-200", label: "Amber" },
  rose: { dot: "bg-rose-500", soft: "bg-rose-100 text-rose-700", ring: "ring-rose-200", label: "Rose" },
  violet: { dot: "bg-violet-500", soft: "bg-violet-100 text-violet-700", ring: "ring-violet-200", label: "Violet" },
  cyan: { dot: "bg-cyan-500", soft: "bg-cyan-100 text-cyan-700", ring: "ring-cyan-200", label: "Cyan" },
  orange: { dot: "bg-orange-500", soft: "bg-orange-100 text-orange-700", ring: "ring-orange-200", label: "Orange" },
};
