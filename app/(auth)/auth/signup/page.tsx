"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/shared/supabase/client";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GoogleSignIn from "@/components/auth/google-signin";
import Logo from "@/components/common/logo";
import { useUser } from "@/lib/users/context";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { FieldSeparator } from "@/components/ui/field";

const getErrorMessage = (raw: string): string => {
  const lower = raw.toLowerCase();
  if (lower.includes("invalid login credentials") || lower.includes("invalid_credentials")) {
    return "Неверный email или пароль";
  }
  if (lower.includes("user already registered") || lower.includes("already been registered")) {
    return "Аккаунт с таким email уже существует. Войдите или восстановите пароль.";
  }
  if (lower.includes("password")) {
    return "Пароль должен быть не менее 6 символов";
  }
  return raw;
};

const SignUpPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { user, isLoading: userLoading } = useUser();
  const router = useRouter();

  if (!userLoading && user) {
    router.replace("/");
    return null;
  }

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
    if (password.length < 12 || !/[0-9]/.test(password) || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[!@#$%^&*]/.test(password)) {
      setError("Пароль должен быть не менее 12 символов и содержать хотя бы одну цифру, одну букву и один специальный символ");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
        },
      });

      if (signUpError) {
        setError(getErrorMessage(signUpError.message));
        return;
      }

      if (data?.session) {
        router.refresh();
        router.replace("/");
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="mx-auto flex h-full items-center justify-center px-2">
        <Card className="w-full max-w-md">
          <CardHeader className="flex flex-col gap-2 text-center">
            <div className="flex justify-center w-full">
              <Logo size="lg" />
            </div>
            <CardDescription>
              На указанный email отправлено письмо для подтверждения. Перейдите по ссылке в письме, затем войдите в аккаунт.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              render={<Link href="/auth/login" />}
              nativeButton={false}
            >
              К входу
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full items-center justify-center px-2">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-2 text-center items-center">
          <div className="flex items-center justify-center w-full">
            <Logo size="lg" />
          </div>
          <CardDescription className="text-center">
            Создайте аккаунт для учёта вещей в домашнем складе
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <Field className="space-y-2">
                <FieldLabel htmlFor="email-signup">Email</FieldLabel>
                <Input
                  id="email-signup"
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
              <Field className="space-y-2">
                <FieldLabel htmlFor="password-signup">Пароль</FieldLabel>
                <Input
                  id="password-signup"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Минимум 6 символов"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  aria-label="Пароль"
                  aria-invalid={!!error}
                  className="w-full"
                />
              </Field>

              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Создание..." : "Зарегистрироваться"}
              </Button>
            </form>
            <FieldSeparator />
            <div className="flex justify-center">
              <GoogleSignIn />
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Уже есть аккаунт?{" "}
              <Link
                href="/auth/login"
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                Войти
              </Link>
            </p>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUpPage;
