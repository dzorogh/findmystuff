"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

const Logo = ({ className, showText = true, size = "md" }: LogoProps) => {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const sizes = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12",
  };

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  if (showText) {
    return (
      <div className={`${className || ""} ${sizes[size]}`}>
        <img
          src="/logo-with-name.svg"
          alt="FindMyStuff"
          className={`h-full w-auto ${isDark ? "invert" : ""}`}
        />
      </div>
    );
  }

  return (
    <div className={`${className || ""} ${sizes[size]}`}>
      <img
        src="/logo-icon.svg"
        alt="FindMyStuff"
        className={`h-full w-auto ${isDark ? "invert" : ""}`}
      />
    </div>
  );
};

export default Logo;
