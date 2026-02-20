"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import GoogleSignIn from "@/components/auth/google-signin";
import EmailPasswordForm from "@/components/auth/email-password-form";
import Logo from "@/components/common/logo";
import { useUser } from "@/lib/users/context";
import { FieldSeparator } from "@/components/ui/field";

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
    <div className="mx-auto flex h-full items-center justify-center px-2">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-2 text-center">
          <div className="flex items-center justify-center w-full">
            <Logo size="lg" />
          </div>
          <CardDescription>
            Приложение для быстрого поиска и учета вещей в домашнем складе
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <EmailPasswordForm />
            <FieldSeparator />
            <div className="flex justify-center">
              <GoogleSignIn />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Нет аккаунта?{" "}
              <Link
                href="/auth/signup"
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                Зарегистрироваться
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
