"use client";

import { Card, CardContent } from "@/components/ui/card";

interface ErrorCardProps {
  message: string;
}

export const ErrorCard = ({ message }: ErrorCardProps) => {
  if (!message) return null;

  return (
    <Card className="border-destructive">
      <CardContent className="pt-6">
        <p className="text-sm text-destructive">{message}</p>
      </CardContent>
    </Card>
  );
};
