import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!;
const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET || "wedding-media";
const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL!; // e.g. https://pub-xxx.r2.dev

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export async function uploadToR2(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: filename,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return `${R2_PUBLIC_URL.replace(/\/$/, "")}/${filename}`;
}

export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_PUBLIC_URL);
}
