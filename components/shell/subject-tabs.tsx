"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SubjectTabs({ subjectId }: { subjectId: string }) {
  const pathname = usePathname();
  const base = `/subjects/${subjectId}`;

  const tabs = [
    { href: base, label: "Overview", exact: true },
    { href: `${base}/documents`, label: "Documents", exact: false },
    { href: `${base}/exams`, label: "Exams", exact: false },
    { href: `${base}/notes`, label: "Notes", exact: false },
    { href: `${base}/generate`, label: "Generate", exact: false },
    { href: `${base}/library`, label: "Library", exact: false },
    { href: `${base}/context`, label: "Context", exact: false },
  ];

  return (
    <nav className="-mb-px flex gap-0.5 border-b border-border/60">
      {tabs.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative px-3.5 py-2 text-sm font-medium transition-colors duration-150",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {active && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-t-full bg-primary" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
