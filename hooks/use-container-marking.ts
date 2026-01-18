"use client";

import { useMemo } from "react";
import { useSettings } from "@/hooks/use-settings";
import { generateContainerMarking as generateMarking, type ContainerType } from "@/lib/utils";

/**
 * Хук для генерации маркировки контейнера с использованием шаблона из настроек
 */
export const useContainerMarking = () => {
  const { getMarkingTemplate } = useSettings();

  const generateMarkingWithTemplate = useMemo(() => {
    const template = getMarkingTemplate();
    return (
      containerType: ContainerType | null | undefined,
      markingNumber: number | null | undefined
    ): string | null => {
      return generateMarking(containerType, markingNumber, template);
    };
  }, [getMarkingTemplate]);

  return {
    generateMarking: generateMarkingWithTemplate,
  };
};
