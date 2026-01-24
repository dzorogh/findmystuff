import { ImageResponse } from "next/og";

export type IconSize = {
  width: number;
  height: number;
};

type IconPalette = {
  background: string;
  gradientFrom: string;
  gradientTo: string;
  foreground: string;
  accent: string;
};

const iconPalette: IconPalette = {
  background: "#ffffff",
  gradientFrom: "#111827",
  gradientTo: "#1f2937",
  foreground: "#ffffff",
  accent: "#0f172a",
};

export const iconSizes: Record<"sm" | "lg", IconSize> = {
  sm: {
    width: 256,
    height: 256,
  },
  lg: {
    width: 512,
    height: 512,
  },
};

const IconMarkup = () => {
  return (
    <div
      role="img"
      aria-label="FindMyStuff icon"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "78%",
          height: "78%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "22%",
          background: `linear-gradient(135deg, ${iconPalette.gradientFrom}, ${iconPalette.gradientTo})`,
          boxShadow: "0 8px 18px rgba(15, 23, 42, 0.35)",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="62%"
          height="62%"
          fill="none"
          stroke={iconPalette.foreground}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m7.5 4.27 9 5.15" />
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73Z" />
          <path d="m3.3 7 8.7 5 8.7-5" />
          <path d="M12 22V12" />
        </svg>
        <div
          style={{
            position: "absolute",
            right: "-4%",
            bottom: "-4%",
            width: "34%",
            height: "34%",
            borderRadius: "999px",
            backgroundColor: iconPalette.background,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="70%"
            height="70%"
            fill="none"
            stroke={iconPalette.accent}
            strokeWidth={2.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export const createIconResponse = (size: IconSize) => {
  return new ImageResponse(<IconMarkup />, size);
};

export const createIconErrorResponse = (error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.log(message);
  return new Response("Failed to generate the image", {
    status: 500,
  });
};
