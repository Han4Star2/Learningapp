import Link from "next/link";
import { createSchoolYear } from "@/actions/school-years";
import { YearForm } from "@/components/year-form";
import { Card } from "@/components/ui";

export default function NewYearPage() {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <Link href="/dashboard" className="text-sm text-gray-500 hover:underline">
        ← Back
      </Link>
      <h1 className="text-2xl font-semibold">New school year</h1>
      <Card>
        <YearForm action={createSchoolYear} submitLabel="Create" />
      </Card>
    </div>
  );
}
