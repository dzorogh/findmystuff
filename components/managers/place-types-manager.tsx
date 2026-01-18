"use client";

import { useMemo } from "react";
import { useSettings } from "@/hooks/use-settings";
import { TypesManager } from "@/components/common/types-manager";

const PlaceTypesManager = () => {
  const { getPlaceTypes, updateSetting, isLoading, settings } = useSettings();

  const placeTypes = useMemo(() => getPlaceTypes(), [settings]);

  const handleSave = async (types: string[]) => {
    return await updateSetting("place_types", JSON.stringify(types));
  };

  return (
    <TypesManager
      types={placeTypes}
      onSave={handleSave}
      isLoading={isLoading}
      settingKey="place_types"
      label="Типы мест"
      placeholder="Введите новый тип (например, Ш)"
      description="Типы мест используются для генерации маркировки (например, Ш1, С1, П1)"
      minTypes={1}
    />
  );
};

export default PlaceTypesManager;
