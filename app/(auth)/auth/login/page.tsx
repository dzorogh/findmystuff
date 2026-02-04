"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import GoogleSignIn from "@/components/auth/google-signin";
import EmailPasswordForm from "@/components/auth/email-password-form";
import Logo from "@/components/common/logo";
import { useUser } from "@/lib/users/context";

const LoginPage = () => {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return null;
  }

  return (
    <div className="mx-auto flex h-full items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <Logo size="lg" showText />
          </div>
          <CardDescription>
            Войдите, чтобы начать вести учет ваших вещей
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Приложение для быстрого поиска и учета вещей в домашнем складе
            </p>
            <EmailPasswordForm />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center bg-card text-xs uppercase text-muted-foreground">
                <span className="px-2">или</span>
              </div>
            </div>
            <div className="flex justify-center pt-2">
              <GoogleSignIn />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
