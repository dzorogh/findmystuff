"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ErrorMessage } from "@/components/common/error-message";
import { FormFooter } from "@/components/common/form-footer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { User } from "@supabase/supabase-js";

interface EditUserFormProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const EditUserForm = ({ user, open, onOpenChange, onSuccess }: EditUserFormProps) => {
  const [email, setEmail] = useState(user.email || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setEmail(user.email || "");
      setError(null);
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Email обязателен для заполнения");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: user.id,
          email: email.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Ошибка обновления пользователя");
      }

      const data = await response.json();
      
      toast.success("Пользователь успешно обновлен", {
        description: data.password ? `Новый пароль: ${data.password}` : undefined,
      });

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        onOpenChange(false);
      }, 100);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Произошла ошибка при обновлении пользователя"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Редактировать пользователя</SheetTitle>
          <SheetDescription>
            Измените email пользователя. При сохранении будет сгенерирован новый пароль.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor={`user-email-${user.id}`}>
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`user-email-${user.id}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              disabled={isSubmitting}
              required
            />
            <p className="text-xs text-muted-foreground">
              При сохранении будет автоматически сгенерирован новый пароль
            </p>
          </div>

          <ErrorMessage message={error || ""} />

          <FormFooter
            isSubmitting={isSubmitting}
            onCancel={() => onOpenChange(false)}
            submitLabel="Сохранить"
          />
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default EditUserForm;
