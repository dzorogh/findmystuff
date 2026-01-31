import * as React from "react";
import { cn } from "@/lib/shared/utils";

interface DividerProps {
  text?: string;
  className?: string;
}

const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ text = "или", className }, ref) => {
    return (
      <div ref={ref} className={cn("relative", className)}>
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">{text}</span>
        </div>
      </div>
    );
  }
);
Divider.displayName = "Divider";

export { Divider };
