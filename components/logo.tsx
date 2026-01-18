"use client";

import { Package, Search } from "lucide-react";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

const Logo = ({ className, showText = true, size = "md" }: LogoProps) => {
  const iconSizes = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
  };

  return (
    <div className={`flex items-center gap-2.5 ${className || ""}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-primary/15 blur-xl rounded-xl" />
        <div className="relative flex items-center justify-center bg-gradient-to-br from-primary to-primary/80 rounded-lg p-1.5 shadow-md">
          <Package className={`${iconSizes[size]} text-primary-foreground`} strokeWidth={2.5} />
          <Search
            className={`absolute -bottom-0.5 -right-0.5 ${size === "sm" ? "h-2.5 w-2.5" : size === "md" ? "h-3 w-3" : "h-4 w-4"} text-primary-foreground bg-background rounded-full p-0.5`}
            strokeWidth={3}
          />
        </div>
      </div>
      {showText && (
        <span
          className={`font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent ${textSizes[size]} tracking-tight`}
        >
          FindMyStuff
        </span>
      )}
    </div>
  );
};

export default Logo;
