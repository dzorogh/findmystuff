"use client";

import { cn } from "@/lib/shared/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const PageContainer = ({ children, className }: PageContainerProps) => {
  return (
    <div className="mx-auto pb-10 p-4">
      <div className={cn("mx-auto", className)}>
        {children}
      </div>
    </div>
  );
};
