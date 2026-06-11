"use client";

import { Button, Card } from "@/components/ui";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card>
      <h2 className="font-medium text-red-600">Something went wrong</h2>
      <p className="mt-1 text-sm text-gray-500">
        {error.message || "An unexpected error occurred."}
      </p>
      <div className="mt-3">
        <Button onClick={reset}>Try again</Button>
      </div>
    </Card>
  );
}
