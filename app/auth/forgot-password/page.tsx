"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/shared/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import Logo from "@/components/common/logo";

const RATE_LIMIT_MESSAGE =
  "Слишком много запросов на отправку писем. Подождите несколько минут и попробуйте снова.";

const getErrorMessage = (raw: string): string => {
  const lower = raw.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return RATE_LIMIT_MESSAGE;
  }
  return raw;
};

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Введите email");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/update-password`
        : undefined;

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: redirectTo ?? undefined,
      });
      if (resetError) {
        setError(getErrorMessage(resetError.message));
        return;
      }
      setIsSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Произошла ошибка";
      setError(getErrorMessage(msg));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <Logo size="lg" showText={true} />
            </div>
            <CardTitle>Проверьте почту</CardTitle>
            <CardDescription>
              Если аккаунт с таким email существует, мы отправили ссылку для сброса пароля.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild variant="outline" className="w-full">
              <Link
                href="/"
                className="inline-flex items-center gap-2"
                aria-label="Вернуться на главную"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                На главную
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Logo size="lg" showText={true} />
          </div>
          <CardTitle>Сброс пароля</CardTitle>
          <CardDescription>
            Введите email вашего аккаунта — мы отправим ссылку для создания нового пароля.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
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
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  <span>Отправка...</span>
                </>
              ) : (
                <span>Отправить ссылку</span>
              )}
            </Button>
            <div className="text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-sm text-primary underline underline-offset-2 hover:no-underline focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring rounded"
                tabIndex={0}
                aria-label="Вернуться к входу"
              >
                <ArrowLeft className="h-3 w-3" aria-hidden />
                Вернуться к входу
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
