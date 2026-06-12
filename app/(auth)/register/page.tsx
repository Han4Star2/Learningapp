"use client";

import { useActionState } from "react";
import Link from "next/link";
import { register, type AuthState } from "@/actions/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    register,
    undefined
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Create your account</CardTitle>
        <CardDescription>Start organizing your studies.</CardDescription>
      </CardHeader>
      <CardContent>
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
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Creating account…" : "Register"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
