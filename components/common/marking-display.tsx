"use client";

interface MarkingDisplayProps {
  typeCode: string | null | undefined;
  markingNumber: number | null | undefined;
  generateMarking: (typeCode: any, markingNumber: number | null | undefined) => string | null;
  className?: string;
}

export const MarkingDisplay = ({
  typeCode,
  markingNumber,
  generateMarking,
  className = "",
}: MarkingDisplayProps) => {
  if (!typeCode || markingNumber === null || markingNumber === undefined) {
    return null;
  }

  const marking = generateMarking(typeCode, markingNumber);

  if (!marking) {
    return null;
  }

  return (
    <div className={`rounded-md bg-muted p-3 ${className}`}>
      <p className="text-sm font-medium">
        Маркировка: {marking}
      </p>
    </div>
  );
};
