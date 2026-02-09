"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/shared/supabase/client";
import { useUser } from "@/lib/users/context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import Logo from "@/components/common/logo";

const MIN_PASSWORD_LENGTH = 6;
const PKCE_VERIFIER_MISSING_ERROR = "pkce code verifier not found in storage";

const getRecoveryErrorMessage = (message: string) => {
  if (message.toLowerCase().includes(PKCE_VERIFIER_MISSING_ERROR)) {
    return "Ссылка открыта в другом браузере или устройстве. Запросите новую ссылку для сброса пароля.";
  }
  return message;
};

const UpdatePasswordPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isUserLoading } = useUser();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkDone, setCheckDone] = useState(false);
  const [hasRecoveryContext, setHasRecoveryContext] = useState(false);
  const [isExchangingCode, setIsExchangingCode] = useState(false);
  const [isApplyingRecoverySession, setIsApplyingRecoverySession] = useState(false);

  const recoveryType = searchParams.get("type");
  const recoveryCode = searchParams.get("code");

  // Сохраняем наличие recovery в hash при первом рендере, т.к. Supabase может очистить hash
  const hadRecoveryHashRef = useRef<boolean>(false);
  const recoverySessionRef = useRef<{ accessToken: string; refreshToken: string } | null>(null);
  const exchangedCodeRef = useRef<string | null>(null);
  const appliedRecoverySessionRef = useRef(false);

  useEffect(() => {
    if (hadRecoveryHashRef.current) return;
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    if (hashParams.get("type") !== "recovery") return;
    hadRecoveryHashRef.current = true;
    if (accessToken && refreshToken) {
      recoverySessionRef.current = { accessToken, refreshToken };
    }
  }, []);

  useEffect(() => {
    if (
      hadRecoveryHashRef.current ||
      recoveryType === "recovery" ||
      !!recoveryCode ||
      !!recoverySessionRef.current
    ) {
      setHasRecoveryContext(true);
    }
  }, [recoveryType, recoveryCode]);

  useEffect(() => {
    const recoverySession = recoverySessionRef.current;
    if (!recoverySession || appliedRecoverySessionRef.current) return;

    appliedRecoverySessionRef.current = true;
    setHasRecoveryContext(true);
    setIsApplyingRecoverySession(true);

    const supabase = createClient();

    const applyRecoverySession = async () => {
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: recoverySession.accessToken,
        refresh_token: recoverySession.refreshToken,
      });
      if (setSessionError) {
        setError(getRecoveryErrorMessage(setSessionError.message));
      }

      if (window.location.hash) {
        window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
      }
    };

    applyRecoverySession()
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : "Не удалось подтвердить ссылку восстановления";
        setError(getRecoveryErrorMessage(message));
      })
      .finally(() => {
        setIsApplyingRecoverySession(false);
      });
  }, []);

  useEffect(() => {
    if (!recoveryCode || exchangedCodeRef.current === recoveryCode) return;

    exchangedCodeRef.current = recoveryCode;
    setHasRecoveryContext(true);
    setIsExchangingCode(true);

    const supabase = createClient();

    const exchange = async () => {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(recoveryCode);
      if (exchangeError) {
        setError(getRecoveryErrorMessage(exchangeError.message));
      }

      // Чистим URL от одноразового code, чтобы не вызывать повторный обмен.
      const params = new URLSearchParams(window.location.search);
      params.delete("code");
      params.delete("type");
      const nextPath = params.toString()
        ? `/auth/update-password?${params.toString()}`
        : "/auth/update-password";
      router.replace(nextPath);
    };

    exchange()
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : "Не удалось подтвердить ссылку восстановления";
        setError(getRecoveryErrorMessage(message));
      })
      .finally(() => {
        setIsExchangingCode(false);
      });
  }, [recoveryCode, router]);

  useEffect(() => {
    if (!hasRecoveryContext) {
      setCheckDone(true);
      return;
    }
    if (user) {
      setCheckDone(true);
      return;
    }
    if (isUserLoading || isExchangingCode || isApplyingRecoverySession) {
      return;
    }
    const timeoutId = setTimeout(() => {
      setCheckDone(true);
    }, 1200);
    return () => clearTimeout(timeoutId);
  }, [user, isUserLoading, hasRecoveryContext, isExchangingCode, isApplyingRecoverySession]);

  const isReady = Boolean(user && hasRecoveryContext);

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

  if (!checkDone || isUserLoading || isExchangingCode || isApplyingRecoverySession) {
    return (
      <div className="mx-auto flex min-h-[60vh] items-center justify-center px-2">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="mx-auto flex min-h-[60vh] items-center justify-center px-2">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center flex flex-col gap-2">
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
    <div className="mx-auto flex min-h-[60vh] items-center justify-center px-2">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center flex flex-col gap-2">
          <div className="flex justify-center">
            <Logo size="lg" showText={true} />
          </div>
          <CardTitle>Новый пароль</CardTitle>
          <CardDescription>
            Введите новый пароль для вашего аккаунта (не менее {MIN_PASSWORD_LENGTH} символов).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
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

function UpdatePasswordFallback() {
  return (
    <div className="mx-auto flex min-h-[60vh] items-center justify-center px-2">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
        <p>Загрузка...</p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<UpdatePasswordFallback />}>
      <UpdatePasswordPage />
    </Suspense>
  );
}
