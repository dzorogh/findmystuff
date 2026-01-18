import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import https from "https";

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
  requestHandler: new NodeHttpHandler({
    connectionTimeout: 30000, // 30 секунд на установку соединения
    socketTimeout: 300000, // 5 минут на передачу данных (для больших файлов)
    requestTimeout: 300000, // 5 минут общий таймаут запроса
    httpsAgent: new https.Agent({
      keepAlive: true,
      keepAliveMsecs: 1000,
      maxSockets: 50,
      maxFreeSockets: 10,
      timeout: 300000,
    }),
  }),
  maxAttempts: 3, // Количество попыток при ошибке
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

    // Формируем публичный URL
    const endpoint = process.env.S3_ENDPOINT || "https://s3.twcstorage.ru";
    
    // Для Supabase Storage используем Supabase Storage API формат
    if (endpoint.includes("storage.supabase.co") || endpoint.includes("supabase.co")) {
      // Если есть NEXT_PUBLIC_SUPABASE_URL, используем его для формирования публичного URL
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl) {
        // Формат для Supabase Storage API: https://[project-ref].supabase.co/storage/v1/object/public/[bucket]/[key]
        return `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${key}`;
      }
      
      // Если нет NEXT_PUBLIC_SUPABASE_URL, пытаемся извлечь project-ref из endpoint
      const endpointMatch = endpoint.match(/https?:\/\/([^.]+)\.storage\.supabase\.co/);
      if (endpointMatch) {
        const projectRef = endpointMatch[1];
        return `https://${projectRef}.supabase.co/storage/v1/object/public/${BUCKET_NAME}/${key}`;
      }
      
      // Fallback: используем endpoint напрямую (убираем /storage/v1/s3 если есть)
      const baseEndpoint = endpoint.replace(/\/storage\/v1\/s3\/?$/, "");
      return `${baseEndpoint}/${BUCKET_NAME}/${key}`;
    }
    
    // Для обычного S3 используем path-style формат
    const publicUrl = `${endpoint}/${BUCKET_NAME}/${key}`;
    return publicUrl;
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
