"use client";

import { useMemo } from "react";
import { useSettings } from "@/hooks/use-settings";
import { TypesManager } from "@/components/common/types-manager";

const ContainerTypesManager = () => {
  const { getContainerTypes, updateSetting, isLoading, settings } = useSettings();

  const containerTypes = useMemo(() => getContainerTypes(), [settings]);

  const handleSave = async (types: string[]) => {
    return await updateSetting("container_types", JSON.stringify(types));
  };

  return (
    <TypesManager
      types={containerTypes}
      onSave={handleSave}
      isLoading={isLoading}
      settingKey="container_types"
      label="Типы контейнеров"
      placeholder="Введите новый тип (например, КОР)"
      description="Типы контейнеров используются для генерации маркировки в формате ТИП-НОМЕР (например, КОР-001)"
      minTypes={1}
    />
  );
};

export default ContainerTypesManager;
