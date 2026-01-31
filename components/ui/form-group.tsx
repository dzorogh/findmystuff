import * as React from "react";
import { cn } from "@/lib/shared/utils";

interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
  separator?: boolean;
}

const FormGroup = React.forwardRef<HTMLDivElement, FormGroupProps>(
  ({ children, className, separator }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "space-y-4",
          separator && "border-t pt-4",
          className
        )}
      >
        {children}
      </div>
    );
  }
);
FormGroup.displayName = "FormGroup";

export { FormGroup };
