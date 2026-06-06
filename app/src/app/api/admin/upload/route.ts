import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import sharp from "sharp";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { uploadToR2, isR2Configured } from "@/utils/r2";

export const runtime = "nodejs";
export const maxDuration = 60;

const COMPRESS_THRESHOLD = 10 * 1024 * 1024; // 10 MB — compress images if over this
const HARD_LIMIT = 50 * 1024 * 1024;          // 50 MB — reject unconditionally
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "audio/mpeg",
  "audio/mp3",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
]);
const ALLOWED_EXTS = new Set(["jpg", "jpeg", "png", "webp", "gif", "heic", "heif", "mp4", "webm", "ogg", "mov", "mp3", "wav", "flac"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/ogg", "video/quicktime"]);
const AUDIO_TYPES = new Set(["audio/mpeg", "audio/mp3", "audio/ogg", "audio/wav", "audio/x-wav", "audio/flac"]);

/** Compress an image buffer to WebP, targeting under COMPRESS_THRESHOLD */
async function compressImage(input: Buffer): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  let quality = 82;
  let output = await sharp(input).webp({ quality }).toBuffer();
  while (output.length > COMPRESS_THRESHOLD && quality > 40) {
    quality -= 10;
    output = await sharp(input).webp({ quality }).toBuffer();
  }
  return { buffer: output, contentType: "image/webp", ext: "webp" };
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Use native formData() — the recommended approach for App Router
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (e) {
    console.error("formData parse error:", e);
    return NextResponse.json({ error: "Failed to parse form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file found in request" }, { status: 400 });
  }

  const bucketName = (formData.get("bucket") as string) || "covers";
  const fileName = file.name || "upload";
  const mimeType = file.type || "";
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";

  const mimeOk = ALLOWED_TYPES.has(mimeType) || (mimeType === "" && ALLOWED_EXTS.has(ext));
  if (!mimeOk) {
    return NextResponse.json({ error: `File type "${mimeType || ext}" is not allowed. Use JPG, PNG, WebP, GIF, MP4, or WebM.` }, { status: 400 });
  }

  const arrayBuf = await file.arrayBuffer();
  if (arrayBuf.byteLength > HARD_LIMIT) {
    return NextResponse.json({ error: `File exceeds ${HARD_LIMIT / 1024 / 1024} MB limit` }, { status: 400 });
  }

  let buffer: Buffer = Buffer.from(arrayBuf);
  let uploadContentType = mimeType || "image/jpeg";
  let fileExt = ext || "jpg";

  // Compress images over 10 MB — skip compression for video/audio files
  if (!VIDEO_TYPES.has(mimeType) && !AUDIO_TYPES.has(mimeType) && buffer.length > COMPRESS_THRESHOLD) {
    try {
      const compressed = await compressImage(buffer);
      buffer = compressed.buffer;
      uploadContentType = compressed.contentType;
      fileExt = compressed.ext;
    } catch (err) {
      console.error("Compression error:", err);
      return NextResponse.json({ error: "Failed to compress image" }, { status: 500 });
    }
  }

  const filePrefix = bucketName === "gallery" ? "photo" : bucketName === "videos" ? "video" : bucketName === "audio" ? "music" : "cover";
  const filename = `${filePrefix}-${Date.now()}.${fileExt}`;

  // Upload to Cloudflare R2 if configured, otherwise fall back to Supabase Storage
  if (isR2Configured()) {
    try {
      const publicUrl = await uploadToR2(buffer, `${bucketName}/${filename}`, uploadContentType);
      return NextResponse.json({ url: publicUrl });
    } catch (err) {
      console.error("R2 upload error:", err);
      return NextResponse.json({ error: "Upload to R2 failed" }, { status: 500 });
    }
  }

  // Fallback: Supabase Storage
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  if (!buckets?.find((b) => b.name === bucketName)) {
    const { error: bucketError } = await supabaseAdmin.storage.createBucket(bucketName, { public: true });
    if (bucketError) {
      console.error("Bucket creation error:", bucketError);
      return NextResponse.json({ error: "Could not create storage bucket." }, { status: 500 });
    }
  }

  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(filename, buffer, { contentType: uploadContentType, upsert: true });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return NextResponse.json({ error: "Upload failed: " + uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(bucketName)
    .getPublicUrl(filename);

  return NextResponse.json({ url: publicUrl });
}
