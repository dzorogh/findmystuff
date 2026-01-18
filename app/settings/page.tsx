"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/hooks/use-settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { useAdmin } from "@/hooks/use-admin";
import ContainerTypesManager from "@/components/managers/container-types-manager";
import MarkingTemplateManager from "@/components/managers/marking-template-manager";
import PlaceTypesManager from "@/components/managers/place-types-manager";
import PlaceMarkingTemplateManager from "@/components/managers/place-marking-template-manager";
import AdminEmailsManager from "@/components/managers/admin-emails-manager";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const { isLoading, error, getAdminEmails } = useSettings();
  const { isAdmin } = useAdmin();

  const adminEmails = getAdminEmails();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/");
    }
  }, [isUserLoading, user, router]);

  if (isLoading || isUserLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mx-auto max-w-4xl space-y-6">
          <Skeleton className="h-10 w-48" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              У вас нет прав для просмотра настроек.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 sm:h-8 sm:w-8" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Настройки</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Управление настройками приложения
            </p>
          </div>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Настройки маркировки контейнеров */}
        <Card>
          <CardHeader>
            <CardTitle>Маркировка контейнеров</CardTitle>
            <CardDescription>
              Управление типами контейнеров для системы маркировки
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-4">Типы контейнеров</h3>
              <ContainerTypesManager />
            </div>
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium mb-4">Шаблон маркировки</h3>
              <MarkingTemplateManager />
            </div>
          </CardContent>
        </Card>

        {/* Настройки маркировки мест */}
        <Card>
          <CardHeader>
            <CardTitle>Маркировка мест</CardTitle>
            <CardDescription>
              Управление типами мест для системы маркировки
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-4">Типы мест</h3>
              <PlaceTypesManager />
            </div>
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium mb-4">Шаблон маркировки</h3>
              <PlaceMarkingTemplateManager />
            </div>
          </CardContent>
        </Card>

        {/* Настройки доступа */}
        <Card>
          <CardHeader>
            <CardTitle>Доступ</CardTitle>
            <CardDescription>
              Настройки прав доступа и администраторов
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AdminEmailsManager />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
