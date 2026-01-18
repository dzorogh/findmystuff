"use client";

import { useState, useEffect, useMemo } from "react";
import { useSettings } from "@/hooks/use-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

const AdminEmailsManager = () => {
  const { getAdminEmails, updateSetting, isLoading, settings } = useSettings();
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Мемоизируем список email'ов, чтобы избежать бесконечного цикла
  const adminEmails = useMemo(() => getAdminEmails(), [settings]);

  useEffect(() => {
    if (!isLoading) {
      setEmails(adminEmails);
    }
  }, [isLoading, adminEmails]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddEmail = () => {
    if (!newEmail.trim()) {
      toast.error("Введите email адрес");
      return;
    }

    const trimmedEmail = newEmail.trim().toLowerCase();
    
    if (!validateEmail(trimmedEmail)) {
      toast.error("Введите корректный email адрес");
      return;
    }

    if (emails.includes(trimmedEmail)) {
      toast.error("Этот email уже добавлен");
      return;
    }

    setEmails([...emails, trimmedEmail]);
    setNewEmail("");
  };

  const handleRemoveEmail = (index: number) => {
    if (emails.length === 1) {
      toast.error("Должен быть хотя бы один администратор");
      return;
    }
    const newEmails = emails.filter((_, i) => i !== index);
    setEmails(newEmails);
  };

  const handleSave = async () => {
    if (emails.length === 0) {
      toast.error("Должен быть хотя бы один администратор");
      return;
    }

    // Проверяем все email'ы на валидность
    for (const email of emails) {
      if (!validateEmail(email)) {
        toast.error(`Некорректный email: ${email}`);
        return;
      }
    }

    setIsSaving(true);
    const result = await updateSetting("admin_emails", JSON.stringify(emails));
    setIsSaving(false);

    if (result.success) {
      toast.success("Список администраторов обновлен");
    } else {
      toast.error(result.error || "Ошибка при сохранении");
      // Восстанавливаем исходные email'ы при ошибке
      setEmails(adminEmails);
    }
  };

  const hasChanges = JSON.stringify(emails.sort()) !== JSON.stringify(adminEmails.sort());

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Загрузка...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Администраторы</Label>
        <div className="flex flex-wrap gap-2">
          {emails.map((email, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md"
            >
              <span className="text-sm font-mono">{email}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleRemoveEmail(index)}
                disabled={emails.length === 1}
                title="Удалить администратора"
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="admin@example.com"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddEmail();
            }
          }}
        />
        <Button onClick={handleAddEmail} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Добавить
        </Button>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Сохранение...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Сохранить изменения
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Пользователи с указанными email адресами имеют права администратора
      </p>
    </div>
  );
};

export default AdminEmailsManager;
