"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "@/components/clsx";

export function SubjectTabs({ subjectId }: { subjectId: string }) {
  const pathname = usePathname();
  const base = `/subjects/${subjectId}`;

  const tabs = [
    { href: base, label: "Overview", exact: true },
    { href: `${base}/documents`, label: "Documents", exact: false },
    { href: `${base}/generate`, label: "Generate", exact: false },
    { href: `${base}/library`, label: "Library", exact: false },
  ];

  return (
    <nav className="flex gap-1 border-b border-gray-200">
      {tabs.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition",
              active
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-900"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
