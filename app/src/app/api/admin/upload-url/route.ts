import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { isR2Configured } from "@/utils/r2";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ALLOWED_TYPES = new Set(["video/mp4", "video/webm", "video/ogg", "video/quicktime"]);
const ALLOWED_EXTS = new Set(["mp4", "webm", "ogg", "mov"]);

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bucket, filename, contentType } = await req.json();

  if (!bucket || !filename) {
    return NextResponse.json({ error: "Missing bucket or filename" }, { status: 400 });
  }

  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const typeOk = ALLOWED_TYPES.has(contentType) || ALLOWED_EXTS.has(ext);
  if (!typeOk) {
    return NextResponse.json({ error: "Invalid file type for direct upload" }, { status: 400 });
  }

  // Use R2 if configured
  if (isR2Configured()) {
    try {
      const r2 = getR2Client();
      const key = `${bucket}/${filename}`;
      const command = new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET || "wedding-media",
        Key: key,
        ContentType: contentType,
      });
      const signedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });
      const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL!.replace(/\/$/, "")}/${key}`;
      return NextResponse.json({ signedUrl, publicUrl });
    } catch (err) {
      console.error("R2 signed URL error:", err);
      return NextResponse.json({ error: "Could not create R2 upload URL" }, { status: 500 });
    }
  }

  // Fallback: Supabase Storage
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  if (!buckets?.find((b) => b.name === bucket)) {
    const { error: bucketError } = await supabaseAdmin.storage.createBucket(bucket, { public: true });
    if (bucketError) {
      return NextResponse.json({ error: "Could not create storage bucket." }, { status: 500 });
    }
  }

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUploadUrl(filename, { upsert: true });

  if (error || !data) {
    return NextResponse.json({ error: "Could not create upload URL: " + error?.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabaseAdmin.storage.from(bucket).getPublicUrl(filename);

  return NextResponse.json({ signedUrl: data.signedUrl, publicUrl });
}
