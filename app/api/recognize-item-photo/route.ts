import { NextRequest, NextResponse } from "next/server";
import { recognizeItemFromPhoto } from "@/lib/shared/api/recognize-item-photo-server";
import { requireAuth } from "@/lib/shared/api/require-auth";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";
import { MAX_UPLOAD_FILE_SIZE_BYTES } from "@/lib/shared/api/constants";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI не настроен (OPENAI_API_KEY)", itemName: null },
        { status: HTTP_STATUS.SERVICE_UNAVAILABLE }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Файл не найден", itemName: null },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Файл должен быть изображением", itemName: null },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: "Размер файла не должен превышать 10MB",
          itemName: null,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
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
      return NextResponse.json({ itemName: null, error });
    }

    return NextResponse.json({ itemName });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ошибка при распознавании фото";
    return NextResponse.json(
      { itemName: null, error: message },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
