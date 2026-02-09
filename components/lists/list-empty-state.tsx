"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface ListEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function ListEmptyState({ icon: Icon, title, description }: ListEmptyStateProps) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Icon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">{title}</p>
        {description && <p className="text-sm text-muted-foreground mt-2">{description}</p>}
      </CardContent>
    </Card>
  );
}
