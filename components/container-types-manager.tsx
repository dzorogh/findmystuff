"use client";

import { useState, useEffect, useMemo } from "react";
import { useSettings } from "@/hooks/use-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

const ContainerTypesManager = () => {
  const { getContainerTypes, updateSetting, isLoading, settings } = useSettings();
  const [types, setTypes] = useState<string[]>([]);
  const [newType, setNewType] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Мемоизируем типы контейнеров, чтобы избежать бесконечного цикла
  const containerTypes = useMemo(() => getContainerTypes(), [settings]);

  useEffect(() => {
    if (!isLoading) {
      setTypes(containerTypes);
    }
  }, [isLoading, containerTypes]);

  const handleAddType = () => {
    if (!newType.trim()) {
      toast.error("Введите тип контейнера");
      return;
    }

    const trimmedType = newType.trim().toUpperCase();
    
    if (types.includes(trimmedType)) {
      toast.error("Такой тип уже существует");
      return;
    }

    if (trimmedType.length > 10) {
      toast.error("Тип не может быть длиннее 10 символов");
      return;
    }

    setTypes([...types, trimmedType]);
    setNewType("");
  };

  const handleRemoveType = (index: number) => {
    const newTypes = types.filter((_, i) => i !== index);
    setTypes(newTypes);
  };

  const handleSave = async () => {
    if (types.length === 0) {
      toast.error("Должен быть хотя бы один тип контейнера");
      return;
    }

    setIsSaving(true);
    const result = await updateSetting("container_types", JSON.stringify(types));
    setIsSaving(false);

    if (result.success) {
      toast.success("Типы контейнеров обновлены");
    } else {
      toast.error(result.error || "Ошибка при сохранении");
      // Восстанавливаем исходные типы при ошибке
      setTypes(containerTypes);
    }
  };

  const hasChanges = JSON.stringify(types) !== JSON.stringify(containerTypes);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Загрузка...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Типы контейнеров</Label>
        <div className="flex flex-wrap gap-2">
          {types.map((type, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md"
            >
              <span className="font-mono text-sm">{type}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleRemoveType(index)}
                disabled={types.length === 1}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          type="text"
          value={newType}
          onChange={(e) => setNewType(e.target.value.toUpperCase())}
          placeholder="Введите новый тип (например, КОР)"
          maxLength={10}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddType();
            }
          }}
        />
        <Button onClick={handleAddType} variant="outline">
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
        Типы контейнеров используются для генерации маркировки в формате ТИП-НОМЕР (например, КОР-001)
      </p>
    </div>
  );
};

export default ContainerTypesManager;
