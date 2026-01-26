"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/ui/form-field";
import { FormGroup } from "@/components/ui/form-group";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Email обязателен для заполнения");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiClient.updateUser({
        id: user.id,
        email: email.trim(),
      });

      if (response.error) {
        throw new Error(response.error);
      }
      
      toast.success("Пользователь успешно обновлен", {
        description: response.data?.password ? `Новый пароль: ${response.data.password}` : undefined,
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
        <form onSubmit={handleSubmit} className="mt-6">
          <FormGroup>
            <FormField
              label="Email"
              htmlFor={`user-email-${user.id}`}
              required
              description="При сохранении будет автоматически сгенерирован новый пароль"
            >
              <Input
                id={`user-email-${user.id}`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                disabled={isSubmitting}
                required
              />
            </FormField>

            <ErrorMessage message={error || ""} />

            <FormFooter
              isSubmitting={isSubmitting}
              onCancel={() => onOpenChange(false)}
              submitLabel="Сохранить"
            />
          </FormGroup>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default EditUserForm;
