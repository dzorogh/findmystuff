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
import ContainerTypesManager from "@/components/managers/container-types-manager";
import MarkingTemplateManager from "@/components/managers/marking-template-manager";
import PlaceTypesManager from "@/components/managers/place-types-manager";
import PlaceMarkingTemplateManager from "@/components/managers/place-marking-template-manager";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const { isLoading, error } = useSettings();


  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/");
    }
  }, [isUserLoading, user, router]);

  if (isLoading || isUserLoading) {
    return (
      <div className="container mx-auto pb-10 pt-4 px-4 md:py-10">
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

        {/* Раздел: Контейнеры */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Контейнеры</h2>
          </div>

          {/* Типы контейнеров */}
          <Card>
            <CardHeader>
              <CardTitle>Типы контейнеров</CardTitle>
              <CardDescription>
                Управление типами контейнеров для системы маркировки
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContainerTypesManager />
            </CardContent>
          </Card>

          {/* Шаблон маркировки контейнеров */}
          <Card>
            <CardHeader>
              <CardTitle>Шаблон маркировки контейнеров</CardTitle>
              <CardDescription>
                Настройка формата маркировки для контейнеров
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MarkingTemplateManager />
            </CardContent>
          </Card>
        </div>

        {/* Раздел: Места */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Места</h2>
          </div>

          {/* Типы мест */}
          <Card>
            <CardHeader>
              <CardTitle>Типы мест</CardTitle>
              <CardDescription>
                Управление типами мест для системы маркировки
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlaceTypesManager />
            </CardContent>
          </Card>

          {/* Шаблон маркировки мест */}
          <Card>
            <CardHeader>
              <CardTitle>Шаблон маркировки мест</CardTitle>
              <CardDescription>
                Настройка формата маркировки для мест
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlaceMarkingTemplateManager />
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
