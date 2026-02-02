"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/shared/supabase/client";
import { useUser } from "@/lib/users/context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import Logo from "@/components/common/logo";

const MIN_PASSWORD_LENGTH = 6;

const UpdatePasswordPage = () => {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkDone, setCheckDone] = useState(false);
  // Сохраняем наличие recovery в hash при первом рендере — Supabase потом может очистить hash
  const hadRecoveryHashRef = useRef<boolean>(false);
  if (typeof window !== "undefined" && !hadRecoveryHashRef.current) {
    hadRecoveryHashRef.current = window.location.hash.includes("type=recovery");
  }

  useEffect(() => {
    const hasRecoveryHash = hadRecoveryHashRef.current;
    if (!hasRecoveryHash) {
      setCheckDone(true);
      return;
    }
    if (user) {
      setCheckDone(true);
      return;
    }
    if (isUserLoading) {
      return;
    }
    const timeoutId = setTimeout(() => {
      setCheckDone(true);
    }, 1200);
    return () => clearTimeout(timeoutId);
  }, [user, isUserLoading]);

  const isReady = Boolean(user && hadRecoveryHashRef.current);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Пароль должен быть не менее ${MIN_PASSWORD_LENGTH} символов`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  if (!checkDone || isUserLoading) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <Logo size="lg" showText={true} />
            </div>
            <CardTitle>Неверная ссылка</CardTitle>
            <CardDescription>
              Используйте ссылку из письма для сброса пароля или запросите новую на странице
              сброса пароля.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/forgot-password">Сбросить пароль</Link>
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
          <CardTitle>Новый пароль</CardTitle>
          <CardDescription>
            Введите новый пароль для вашего аккаунта (не менее {MIN_PASSWORD_LENGTH} символов).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Новый пароль</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                aria-label="Новый пароль"
                aria-invalid={!!error}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Повторите пароль</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                aria-label="Повторите пароль"
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
                  <span>Сохранение...</span>
                </>
              ) : (
                <span>Сохранить пароль</span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdatePasswordPage;
