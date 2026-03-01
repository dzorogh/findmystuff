"use client";

import { useState } from "react";
import { useTenant } from "@/contexts/tenant-context";
import { createUser } from "@/lib/users/api";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { ErrorMessage } from "@/components/common/error-message";
import { FormFooter } from "@/components/forms/form-footer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface AddUserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddUserForm = ({ open, onOpenChange, onSuccess }: AddUserFormProps) => {
  const { activeTenantId } = useTenant();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Email обязателен для заполнения");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await createUser(
        { email: email.trim(), email_confirm: true },
        activeTenantId
      );

      if (response.error) {
        throw new Error(response.error);
      }

      const invited = response.data?.invited;
      toast.success(
        invited ? "Пользователь добавлен в склад" : "Пользователь успешно создан",
        {
          description: invited
            ? "Он сможет переключаться между складами в меню"
            : response.data?.message ?? undefined,
        }
      );
      setEmail("");

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        onOpenChange(false);
      }, 100);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Произошла ошибка при создании пользователя"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Добавить пользователя</SheetTitle>
          <SheetDescription>
            Введите email — если пользователь уже зарегистрирован, он получит доступ к складу и сможет переключаться между складами. Если нет — будет создан новый аккаунт.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="px-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="user-email">
                Email
                <span className="text-destructive ml-1">*</span>
              </FieldLabel>
              <FieldDescription>
                Существующий пользователь получит доступ к текущему складу. Новому будет сгенерирован пароль.
              </FieldDescription>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                disabled={isSubmitting}
                required
              />
            </Field>

            <ErrorMessage message={error || ""} />

            <FormFooter
              isSubmitting={isSubmitting}
              onCancel={() => onOpenChange(false)}
              submitLabel="Добавить пользователя"
              submitIcon={Plus}
            />
          </FieldGroup>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AddUserForm;
