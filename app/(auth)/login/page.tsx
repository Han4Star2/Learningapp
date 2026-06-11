"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthState } from "@/actions/auth";
import { Button, Card, Input } from "@/components/ui";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    login,
    undefined
  );

  return (
    <Card>
      <h1 className="mb-1 text-xl font-semibold">Welcome back</h1>
      <p className="mb-4 text-sm text-gray-500">Log in to your account.</p>

      <form action={formAction} className="space-y-3">
        <Input name="email" type="email" placeholder="Email" autoComplete="email" required />
        <Input
          name="password"
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          required
        />

        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        No account?{" "}
        <Link href="/register" className="font-medium text-gray-900 underline">
          Register
        </Link>
      </p>
    </Card>
  );
}
