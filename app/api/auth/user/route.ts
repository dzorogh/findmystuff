import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/users/server";

export async function GET() {
  try {
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json(
        { error: "Не авторизован" },
        { status: 401 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Ошибка получения пользователя:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Произошла ошибка при получении пользователя",
      },
      { status: 500 }
    );
  }
}
