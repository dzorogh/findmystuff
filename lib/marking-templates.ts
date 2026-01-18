export interface MarkingTemplate {
  value: string;
  label: string;
  example: string;
}

// Единый список шаблонов маркировки для контейнеров и мест
// Отсортирован по логике: сначала простые форматы, затем с разделителями, затем с форматированием номера
export const MARKING_TEMPLATES: MarkingTemplate[] = [
  // Простые форматы без разделителя
  { value: "{TYPE}{NUMBER}", label: "{TYPE}{NUMBER} (например, КОР1 или Ш1)", example: "КОР1" },
  { value: "{TYPE}{NUMBER:2}", label: "{TYPE}{NUMBER:2} (например, КОР01 или Ш01)", example: "КОР01" },
  { value: "{TYPE}{NUMBER:3}", label: "{TYPE}{NUMBER:3} (например, КОР001 или Ш001)", example: "КОР001" },
  { value: "{TYPE}{NUMBER:4}", label: "{TYPE}{NUMBER:4} (например, КОР0001 или Ш0001)", example: "КОР0001" },
  
  // Форматы с дефисом
  { value: "{TYPE}-{NUMBER}", label: "{TYPE}-{NUMBER} (например, КОР-1 или Ш-1)", example: "КОР-1" },
  { value: "{TYPE}-{NUMBER:2}", label: "{TYPE}-{NUMBER:2} (например, КОР-01 или Ш-01)", example: "КОР-01" },
  { value: "{TYPE}-{NUMBER:3}", label: "{TYPE}-{NUMBER:3} (например, КОР-001 или Ш-001)", example: "КОР-001" },
  { value: "{TYPE}-{NUMBER:4}", label: "{TYPE}-{NUMBER:4} (например, КОР-0001 или Ш-0001)", example: "КОР-0001" },
  
  // Форматы в квадратных скобках
  { value: "[{TYPE}]{NUMBER}", label: "[{TYPE}]{NUMBER} (например, [КОР]1 или [Ш]1)", example: "[КОР]1" },
  { value: "[{TYPE}]{NUMBER:2}", label: "[{TYPE}]{NUMBER:2} (например, [КОР]01 или [Ш]01)", example: "[КОР]01" },
  { value: "[{TYPE}]{NUMBER:3}", label: "[{TYPE}]{NUMBER:3} (например, [КОР]001 или [Ш]001)", example: "[КОР]001" },
  { value: "[{TYPE}]{NUMBER:4}", label: "[{TYPE}]{NUMBER:4} (например, [КОР]0001 или [Ш]0001)", example: "[КОР]0001" },
  
  // Форматы с номером перед типом
  { value: "{NUMBER}{TYPE}", label: "{NUMBER}{TYPE} (например, 1КОР или 1Ш)", example: "1КОР" },
  { value: "{NUMBER:2}{TYPE}", label: "{NUMBER:2}{TYPE} (например, 01КОР или 01Ш)", example: "01КОР" },
  { value: "{NUMBER:3}{TYPE}", label: "{NUMBER:3}{TYPE} (например, 001КОР или 001Ш)", example: "001КОР" },
  { value: "{NUMBER:4}{TYPE}", label: "{NUMBER:4}{TYPE} (например, 0001КОР или 0001Ш)", example: "0001КОР" },
  
  // Форматы с номером перед типом и дефисом
  { value: "{NUMBER}-{TYPE}", label: "{NUMBER}-{TYPE} (например, 1-КОР или 1-Ш)", example: "1-КОР" },
  { value: "{NUMBER:2}-{TYPE}", label: "{NUMBER:2}-{TYPE} (например, 01-КОР или 01-Ш)", example: "01-КОР" },
  { value: "{NUMBER:3}-{TYPE}", label: "{NUMBER:3}-{TYPE} (например, 001-КОР или 001-Ш)", example: "001-КОР" },
  { value: "{NUMBER:4}-{TYPE}", label: "{NUMBER:4}-{TYPE} (например, 0001-КОР или 0001-Ш)", example: "0001-КОР" },
];
