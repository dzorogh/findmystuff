import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

if (!process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
  console.error("S3 credentials are not set in environment variables");
}

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || "https://s3.twcstorage.ru",
  region: process.env.S3_REGION || "ru-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "b536986d-storage";

export const uploadToS3 = async (
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> => {
  if (!process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
    throw new Error("S3 credentials are not configured");
  }

  const key = `photos/${Date.now()}-${fileName}`;

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await s3Client.send(command);

    // Возвращаем публичный URL
    // Формат для path-style: https://s3.twcstorage.ru/bucket-name/key
    // Формат для virtual-hosted-style: https://bucket-name.s3.twcstorage.ru/key
    // Используем virtual-hosted-style для лучшей совместимости
    const endpoint = process.env.S3_ENDPOINT || "https://s3.twcstorage.ru";
    const baseUrl = endpoint.replace("https://", "").replace("http://", "");
    return `https://${BUCKET_NAME}.${baseUrl}/${key}`;
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error(
      error instanceof Error
        ? `Ошибка загрузки в S3: ${error.message}`
        : "Ошибка загрузки в S3"
    );
  }
};

export { s3Client, BUCKET_NAME };
