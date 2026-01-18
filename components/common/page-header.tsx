"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export const PageHeader = ({ icon: Icon, title, description, action }: PageHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{description}</p>
        </div>
      </div>
      {action && <div className="w-full sm:w-auto">{action}</div>}
    </div>
  );
};
