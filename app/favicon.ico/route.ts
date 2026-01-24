import { createIconResponse, createIconErrorResponse } from "@/lib/icon-image";
import { NextRequest } from "next/server";

export const GET = async (request: NextRequest) => {
  try {
    const prefersColorScheme = request.headers.get("sec-ch-prefers-color-scheme") || 
                               request.headers.get("prefers-color-scheme") ||
                               "light";
    
    const theme: "light" | "dark" = prefersColorScheme === "dark" ? "dark" : "light";
    
    const size = {
      width: 32,
      height: 32,
    };
    
    const response = createIconResponse(size, theme);
    response.headers.set("Cache-Control", "public, max-age=3600, must-revalidate");
    
    return response;
  } catch (error) {
    return createIconErrorResponse(error);
  }
};
