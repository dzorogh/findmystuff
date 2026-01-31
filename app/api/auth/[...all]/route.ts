import { auth } from "@/lib/auth/config";
import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";

const handler = toNextJsHandler(auth);

export async function GET(request: Request) {
  try {
    return await handler.GET(request);
  } catch (error: unknown) {
    console.error("Better Auth GET Error:", error);
    if (error && typeof error === "object" && "code" in error && error.code === "ECONNREFUSED") {
      return NextResponse.json(
        {
          error: "Database connection failed",
          message: "Please check your DATABASE_URL in .env.local file",
        },
        { status: 500 }
      );
    }
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    return await handler.POST(request);
  } catch (error: unknown) {
    console.error("Better Auth POST Error:", error);
    if (error && typeof error === "object" && "code" in error && error.code === "ECONNREFUSED") {
      return NextResponse.json(
        {
          error: "Database connection failed",
          message: "Please check your DATABASE_URL in .env.local file",
        },
        { status: 500 }
      );
    }
    throw error;
  }
}
