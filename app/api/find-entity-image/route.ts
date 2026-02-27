import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/shared/storage";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";
import { requireAuth } from "@/lib/shared/api/require-auth";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";
import { generateEntityImage } from "@/lib/shared/api/find-entity-image-server";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const entityType =
      typeof body.entityType === "string" ? body.entityType : undefined;

    if (!name) {
      return NextResponse.json(
        { error: "Название сущности обязательно" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI не настроен (OPENAI_API_KEY)" },
        { status: HTTP_STATUS.SERVICE_UNAVAILABLE }
      );
    }

    const result = await generateEntityImage(apiKey, name, entityType);
    if ("error" in result) {
      const status =
        result.error === "Изображение слишком большое"
          ? HTTP_STATUS.BAD_REQUEST
          : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      return NextResponse.json({ error: result.error }, { status });
    }

    const { buffer, contentType } = result;
    const ext = "png";
    const fileName = `${name.replace(/[^a-zA-Z0-9-]/g, "_").slice(0, 50)}.${ext}`;

    const url = await uploadToS3(buffer, fileName, contentType);
    return NextResponse.json({ url });
  } catch (error) {
    return apiErrorResponse(error, {
      context: "find-entity-image error:",
      defaultMessage: "Произошла ошибка при генерации изображения",
    });
  }
}
