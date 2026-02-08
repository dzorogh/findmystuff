"use client";

import { useState } from "react";
import { createUser } from "@/lib/users/api";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { FormGroup } from "@/components/ui/form-group";
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
      const response = await createUser({
        email: email.trim(),
        email_confirm: true,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast.success("Пользователь успешно создан", {
        description: response.data?.password ? `Пароль: ${response.data.password}` : undefined,
      });
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
          <SheetTitle>Добавить нового пользователя</SheetTitle>
          <SheetDescription>
            Создайте нового пользователя. Пароль будет сгенерирован автоматически.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="px-6">
          <FormGroup>
            <FormField
              label="Email"
              htmlFor="user-email"
              required
              description="Пароль будет автоматически сгенерирован и показан после создания"
            >
              <Input
                id="user-email"
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
              submitLabel="Добавить пользователя"
              submitIcon={Plus}
            />
          </FormGroup>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AddUserForm;
