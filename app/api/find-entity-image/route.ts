import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/shared/storage";
import { getServerUser } from "@/lib/users/server";
import { generateEntityImage } from "@/lib/shared/api/find-entity-image-server";

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const entityType =
      typeof body.entityType === "string" ? body.entityType : undefined;

    if (!name) {
      return NextResponse.json(
        { error: "Название сущности обязательно" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI не настроен (OPENAI_API_KEY)" },
        { status: 503 }
      );
    }

    const result = await generateEntityImage(apiKey, name, entityType);
    if ("error" in result) {
      const status =
        result.error === "Изображение слишком большое" ? 400 : 502;
      return NextResponse.json({ error: result.error }, { status });
    }

    const { buffer, contentType } = result;
    const ext = "png";
    const fileName = `${name.replace(/[^a-zA-Z0-9-]/g, "_").slice(0, 50)}.${ext}`;

    const url = await uploadToS3(buffer, fileName, contentType);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("find-entity-image error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Произошла ошибка при генерации изображения";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
