import { getAuth } from "@/lib/auth/config";
import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";

export async function GET(request: Request) {
  try {
    const handler = toNextJsHandler(getAuth());
    return await handler.GET(request);
  } catch (error: unknown) {
    console.error("Better Auth GET Error:", error);
    if (error && typeof error === "object" && "code" in error && error.code === "ECONNREFUSED") {
      return NextResponse.json(
        {
          error: "Database connection failed",
          message: "Please check your DATABASE_URL in .env.local file",
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const handler = toNextJsHandler(getAuth());
    return await handler.POST(request);
  } catch (error: unknown) {
    console.error("Better Auth POST Error:", error);
    if (error && typeof error === "object" && "code" in error && error.code === "ECONNREFUSED") {
      return NextResponse.json(
        {
          error: "Database connection failed",
          message: "Please check your DATABASE_URL in .env.local file",
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }
    throw error;
  }
}
