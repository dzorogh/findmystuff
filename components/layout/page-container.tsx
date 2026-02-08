"use client";

import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const PageContainer = ({ children, className }: PageContainerProps) => {
  return (
    <div className={cn("mx-auto p-2", className)}>
      {children}
    </div>
  );
};
