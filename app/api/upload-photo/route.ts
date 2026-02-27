import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/shared/storage";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";
import { requireAuth } from "@/lib/shared/api/require-auth";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";
import { MAX_UPLOAD_FILE_SIZE_BYTES } from "@/lib/shared/api/constants";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Файл не найден" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Проверяем тип файла
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Файл должен быть изображением" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Проверяем размер файла (максимум 10MB)
    const maxSize = MAX_UPLOAD_FILE_SIZE_BYTES;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Размер файла не должен превышать 10MB" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    
    try {
      const url = await uploadToS3(buffer, fileName, file.type);
      if (process.env.NODE_ENV === "development") console.log("Uploaded photo URL:", url);
      return NextResponse.json({ url });
    } catch (s3Error) {
      return apiErrorResponse(s3Error, {
        context: "S3 upload error:",
        defaultMessage: "Ошибка загрузки в S3 хранилище",
      });
    }
  } catch (error) {
    return apiErrorResponse(error, {
      context: "Ошибка загрузки фото:",
      defaultMessage: "Произошла ошибка при загрузке фото",
    });
  }
}
