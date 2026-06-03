import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import sharp from "sharp";
import Busboy from "busboy";
import { PassThrough } from "stream";
import { supabaseAdmin } from "@/utils/supabase/admin";

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

/** Parse multipart/form-data from a raw Buffer via busboy */
interface ParsedUpload {
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  bucketName: string;
}

function parseMultipart(req: NextRequest, body: Buffer): Promise<ParsedUpload> {
  return new Promise((resolve, reject) => {
    const contentType = req.headers.get("content-type") ?? "";
    const bb = Busboy({ headers: { "content-type": contentType }, limits: { fileSize: HARD_LIMIT } });

    let fileBuffer: Buffer | null = null;
    let fileName = "upload";
    let mimeType = "";
    let bucketName = "covers";
    let truncated = false;

    bb.on("file", (_field, file, info) => {
      fileName = info.filename || "upload";
      mimeType = info.mimeType || "";
      const chunks: Buffer[] = [];
      file.on("data", (chunk: Buffer) => chunks.push(chunk));
      file.on("limit", () => { truncated = true; });
      file.on("close", () => { if (!truncated) fileBuffer = Buffer.concat(chunks); });
    });

    bb.on("field", (name, value) => { if (name === "bucket") bucketName = value; });

    bb.on("close", () => {
      if (truncated) return reject(new Error(`File exceeds ${HARD_LIMIT / 1024 / 1024} MB limit`));
      if (!fileBuffer) return reject(new Error("No file found in request"));
      resolve({ fileBuffer, fileName, mimeType, bucketName });
    });

    bb.on("error", (err) => reject(err));

    // Feed the pre-read buffer through a PassThrough into busboy
    const pt = new PassThrough();
    pt.pipe(bb);
    pt.end(body);
  });
}

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

  // Read full body as Buffer — App Router route handlers have no default body size limit
  let bodyBuffer: Buffer;
  try {
    bodyBuffer = Buffer.from(await req.arrayBuffer());
  } catch (e) {
    return NextResponse.json({ error: "Failed to read request body" }, { status: 400 });
  }

  let parsed: ParsedUpload;
  try {
    parsed = await parseMultipart(req, bodyBuffer);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid form data" }, { status: 400 });
  }

  const { fileName, mimeType, bucketName } = parsed;
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const mimeOk = ALLOWED_TYPES.has(mimeType) || (mimeType === "" && ALLOWED_EXTS.has(ext));
  if (!mimeOk) {
    return NextResponse.json({ error: `File type "${mimeType || ext}" is not allowed. Use JPG, PNG, WebP, GIF, MP4, or WebM.` }, { status: 400 });
  }

  // Ensure bucket exists
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  if (!buckets?.find((b) => b.name === bucketName)) {
    const { error: bucketError } = await supabaseAdmin.storage.createBucket(bucketName, { public: true });
    if (bucketError) {
      console.error("Bucket creation error:", bucketError);
      return NextResponse.json({ error: "Could not create storage bucket." }, { status: 500 });
    }
  }

  let buffer = parsed.fileBuffer;
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
