"use client";

import { cn } from "@/lib/shared/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const PageContainer = ({ children, className }: PageContainerProps) => {
  return (
    <div className="container mx-auto pb-10 pt-4 px-4 md:py-6">
      <div className={cn("mx-auto", className)}>
        {children}
      </div>
    </div>
  );
};
