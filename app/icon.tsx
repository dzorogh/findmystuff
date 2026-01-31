import { createIconResponse } from "@/lib/shared/og/icon-image";
import { headers } from "next/headers";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

const Icon = async () => {
  const headersList = await headers();
  
  const prefersColorScheme = headersList.get("sec-ch-prefers-color-scheme") || 
                             headersList.get("prefers-color-scheme") ||
                             "light";
  
  const theme: "light" | "dark" = prefersColorScheme === "dark" ? "dark" : "light";
  
  return createIconResponse(size, theme);
};

export default Icon;
