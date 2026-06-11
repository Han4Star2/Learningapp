"use client";

import { useActionState } from "react";
import Link from "next/link";
import { register, type AuthState } from "@/actions/auth";
import { Button, Card, Input } from "@/components/ui";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    register,
    undefined
  );

  return (
    <Card>
      <h1 className="mb-1 text-xl font-semibold">Create your account</h1>
      <p className="mb-4 text-sm text-gray-500">Start organizing your studies.</p>

      <form action={formAction} className="space-y-3">
        <Input name="full_name" type="text" placeholder="Full name" autoComplete="name" />
        <Input name="email" type="email" placeholder="Email" autoComplete="email" required />
        <Input
          name="password"
          type="password"
          placeholder="Password (min 6 characters)"
          autoComplete="new-password"
          required
        />

        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Creating account…" : "Register"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-gray-900 underline">
          Log in
        </Link>
      </p>
    </Card>
  );
}
