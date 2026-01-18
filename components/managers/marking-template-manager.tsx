"use client";

import { useState, useEffect, useMemo } from "react";
import { useSettings } from "@/hooks/use-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Loader2, Save, Info } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { MARKING_TEMPLATES } from "@/lib/marking-templates";

const MarkingTemplateManager = () => {
  const { settings, updateSetting, isLoading } = useSettings();
  const [template, setTemplate] = useState("");
  const [customTemplate, setCustomTemplate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [useCustom, setUseCustom] = useState(false);

  const templateSetting = useMemo(
    () => settings.find((s) => s.key === "container_marking_template"),
    [settings]
  );

  useEffect(() => {
    if (templateSetting) {
      const value = templateSetting.value;
      const predefined = MARKING_TEMPLATES.find((t) => t.value === value);
      if (predefined) {
        setTemplate(value);
        setUseCustom(false);
      } else {
        setCustomTemplate(value);
        setUseCustom(true);
      }
    } else {
      setTemplate("{TYPE}-{NUMBER}");
      setUseCustom(false);
    }
  }, [templateSetting]);

  const handleTemplateChange = (value: string) => {
    if (value === "custom") {
      setUseCustom(true);
      setCustomTemplate("");
    } else if (value) {
      setUseCustom(false);
      setTemplate(value);
    }
  };

  const handleSave = async () => {
    const templateToSave = useCustom ? customTemplate : template;

    if (!templateToSave || !templateToSave.trim()) {
      toast.error("Шаблон не может быть пустым");
      return;
    }

    const trimmedTemplate = templateToSave.trim();
    
    // Проверяем наличие {TYPE} и любого варианта {NUMBER} (с параметрами или без)
    // {NUMBER} может быть в форматах: {NUMBER}, {NUMBER:2}, {NUMBER:3}, {NUMBER:4} и т.д.
    const hasType = trimmedTemplate.includes("{TYPE}");
    const hasNumber = /\{NUMBER(:?\d+)?\}/.test(trimmedTemplate);
    
    if (!hasType || !hasNumber) {
      toast.error(`Шаблон должен содержать {TYPE} и {NUMBER}. Текущий шаблон: "${trimmedTemplate}"`);
      return;
    }

    setIsSaving(true);
    const result = await updateSetting("container_marking_template", templateToSave.trim());
    setIsSaving(false);

    if (result.success) {
      toast.success("Шаблон маркировки обновлен");
    } else {
      toast.error(result.error || "Ошибка при сохранении");
    }
  };

  const getPreview = (templateValue: string, typeExample: string = "КОР"): string => {
    try {
      // Парсим шаблон для предпросмотра
      let preview = templateValue;
      preview = preview.replace(/{TYPE}/g, typeExample);
      
      // Обрабатываем {NUMBER} с разными форматами
      preview = preview.replace(/{NUMBER:(\d+)}/g, (_, width) => {
        return String(1).padStart(parseInt(width), "0");
      });
      preview = preview.replace(/{NUMBER}/g, String(1));
      
      return preview;
    } catch {
      return "Ошибка в шаблоне";
    }
  };

  const currentTemplate = useCustom ? customTemplate : template;
  const hasChanges = currentTemplate !== templateSetting?.value;

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Загрузка...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Select
          value={useCustom ? "custom" : template}
          onChange={(e) => handleTemplateChange(e.target.value)}
          disabled={isSaving}
        >
          {MARKING_TEMPLATES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
          <option value="custom">Пользовательский шаблон</option>
        </Select>
      </div>

      {useCustom && (
        <div className="space-y-2">
          <Label htmlFor="custom-template">Пользовательский шаблон</Label>
          <Input
            id="custom-template"
            type="text"
            value={customTemplate}
            onChange={(e) => setCustomTemplate(e.target.value)}
            placeholder="{TYPE}-{NUMBER}"
            disabled={isSaving}
          />
          <p className="text-xs text-muted-foreground">
            Используйте {"{TYPE}"} для типа контейнера и {"{NUMBER}"} для номера. 
            Для указания ширины номера используйте {"{NUMBER:2}"} (2 цифры), {"{NUMBER:4}"} (4 цифры) и т.д.
          </p>
        </div>
      )}

      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="space-y-1 text-sm">
              <p className="font-medium">Предпросмотр:</p>
              <p className="font-mono text-base">
                {getPreview(currentTemplate)}
              </p>
              <p className="text-xs text-muted-foreground">
                Пример маркировки для типа "КОР" с номером 1
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Для мест: {getPreview(currentTemplate, "Ш")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
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
    </div>
  );
};

export default MarkingTemplateManager;
