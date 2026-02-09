"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/shared/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";

const EmailPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Введите email");
      return;
    }
    if (!password) {
      setError("Введите пароль");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (signInError) {
        setError(
          signInError.message === "Invalid login credentials"
            ? "Неверный email или пароль"
            : signInError.message
        );
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <Field className="space-y-2">
          <FieldLabel htmlFor="email-signin">
            Email
          </FieldLabel>
          <Input
            id="email-signin"
            type="email"
            autoComplete="email"
            placeholder="example@mail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            aria-label="Email"
            aria-invalid={!!error}
            className="w-full"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password-signin" className="flex items-center justify-between">
            Пароль
            <Link
              href="/auth/forgot-password"
              className="text-xs text-primary underline underline-offset-2 hover:no-underline focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring rounded"
              tabIndex={0}
              aria-label="Сбросить пароль"
            >
              Забыли пароль?
            </Link>
          </FieldLabel>
          <Input
            id="password-signin"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            aria-label="Пароль"
            aria-invalid={!!error}
            className="w-full"
          />
        </Field>
      </FieldGroup>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            <span>Вход...</span>
          </>
        ) : (
          <span>Войти</span>
        )}
      </Button>
    </form>
  );
};

export default EmailPasswordForm;
