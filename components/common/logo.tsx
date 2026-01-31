"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const Logo = ({ className, showText = true, size = "md" }: LogoProps) => {
  const { theme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  const sizes = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12",
  };

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  if (showText) {
    return (
      <div className={`${className || ""} ${sizes[size]}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG logo, next/image not needed */}
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
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG logo, next/image not needed */}
      <img
        src="/logo-icon.svg"
        alt="FindMyStuff"
        className={`h-full w-auto ${isDark ? "invert" : ""}`}
      />
    </div>
  );
};

export default Logo;
