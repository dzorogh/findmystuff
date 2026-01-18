"use client";

import { useMemo } from "react";
import { useSettings } from "@/hooks/use-settings";
import { generateContainerMarking as generateMarking } from "@/lib/utils";

export type PlaceType = string;

/**
 * Хук для генерации маркировки места с использованием шаблона из настроек
 */
export const usePlaceMarking = () => {
  const { getPlaceMarkingTemplate } = useSettings();

  const generateMarkingWithTemplate = useMemo(() => {
    const template = getPlaceMarkingTemplate();
    return (
      placeType: PlaceType | null | undefined,
      markingNumber: number | null | undefined
    ): string | null => {
      return generateMarking(placeType, markingNumber, template);
    };
  }, [getPlaceMarkingTemplate]);

  return {
    generateMarking: generateMarkingWithTemplate,
  };
};
