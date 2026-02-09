"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/shared/supabase/client";
import { useUser } from "@/lib/users/context";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Moon, Sun } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { FieldGroup, FieldLabel, Field } from "@/components/ui/field";

const MIN_PASSWORD_LENGTH = 6;

export default function AccountPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeToggle = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const ThemeIcon = mounted ? (resolvedTheme === "dark" ? Moon : Sun) : null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Пароль должен быть не менее ${MIN_PASSWORD_LENGTH} символов`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setSuccess("Пароль успешно изменён");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Аккаунт" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            Почта
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isUserLoading ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <Input type="email" value={user?.email ?? ""} disabled />
          )}
          <p className="text-sm text-muted-foreground mt-2">Почту нельзя изменить</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Тема</CardTitle>
          <CardDescription>
            Переключение светлой и тёмной темы оформления
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            onClick={handleThemeToggle}
            className="gap-2"
          >
            {ThemeIcon ? <ThemeIcon className="h-4 w-4" /> : null}
            Сменить тему
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Смена пароля</CardTitle>
          <CardDescription>
            Введите новый пароль (не менее {MIN_PASSWORD_LENGTH} символов)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="account-new-password">
                  Новый пароль
                </FieldLabel>
                <Input
                  id="account-new-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  aria-label="Новый пароль"
                  aria-invalid={!!error}
                  className="w-full max-w-sm"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="account-confirm-password">
                  Повторите пароль
                </FieldLabel>
                <Input
                  id="account-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  aria-label="Повторите пароль"
                  aria-invalid={!!error}
                  className="w-full max-w-sm"
                />
              </Field>
            </FieldGroup>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-green-600 dark:text-green-400" role="status">
                {success}
              </p>
            )}

          </form>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                <span>Сохранение...</span>
              </>
            ) : (
              <span>Сохранить пароль</span>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
