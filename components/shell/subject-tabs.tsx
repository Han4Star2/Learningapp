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
    { href: `${base}/generate`, label: "Generate", exact: false },
    { href: `${base}/library`, label: "Library", exact: false },
    { href: `${base}/context`, label: "Context", exact: false },
  ];

  return (
    <nav className="flex gap-1 border-b">
      {tabs.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
