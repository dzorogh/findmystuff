"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTenant, switchTenant } from "@/lib/tenants/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function TenantOnboarding() {
  const [name, setName] = useState("Мой склад");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setIsLoading(true);
    try {
      const tenant = await createTenant(name.trim());
      await switchTenant(tenant.id);
      toast.success("Склад создан");
      router.push("/");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ошибка создания";
      setError(message);
      toast.error(message);
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tenant-name">Название</Label>
        <Input
          id="tenant-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Мой склад"
          disabled={isLoading}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Создание…" : "Создать склад"}
      </Button>
    </form>
  );
}
