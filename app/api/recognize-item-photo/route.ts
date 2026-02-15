import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/users/server";
import { recognizeItemFromPhoto } from "@/lib/shared/api/recognize-item-photo-server";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI не настроен (OPENAI_API_KEY)", itemName: null },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Файл не найден", itemName: null },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Файл должен быть изображением", itemName: null },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "Размер файла не должен превышать 10MB",
          itemName: null,
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { itemName, error } = await recognizeItemFromPhoto(
      apiKey,
      buffer,
      file.type
    );

    if (error) {
      return NextResponse.json(
        { itemName: null, error },
        { status: 200 }
      );
    }

    return NextResponse.json({ itemName });
  } catch (err) {
    console.error("recognize-item-photo error:", err);
    const message =
      err instanceof Error ? err.message : "Ошибка при распознавании фото";
    return NextResponse.json(
      { itemName: null, error: message },
      { status: 500 }
    );
  }
}
