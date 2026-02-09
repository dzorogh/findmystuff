import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/shared/storage";
import { getServerUser } from "@/lib/users/server";

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
    }

    // Проверяем тип файла
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Файл должен быть изображением" },
        { status: 400 }
      );
    }

    // Проверяем размер файла (максимум 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Размер файла не должен превышать 10MB" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    
    try {
      const url = await uploadToS3(buffer, fileName, file.type);
      console.log("Uploaded photo URL:", url);
      return NextResponse.json({ url });
    } catch (s3Error) {
      console.error("S3 upload error:", s3Error);
      const errorMessage =
        s3Error instanceof Error
          ? s3Error.message
          : "Ошибка загрузки в S3 хранилище";
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error) {
    console.error("Ошибка загрузки фото:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Произошла ошибка при загрузке фото";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
