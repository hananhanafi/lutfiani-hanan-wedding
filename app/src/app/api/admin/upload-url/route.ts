import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/utils/supabase/admin";

const ALLOWED_TYPES = new Set(["video/mp4", "video/webm", "video/ogg", "video/quicktime"]);
const ALLOWED_EXTS = new Set(["mp4", "webm", "ogg", "mov"]);

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

  // Ensure bucket exists
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  if (!buckets?.find((b) => b.name === bucket)) {
    const { error: bucketError } = await supabaseAdmin.storage.createBucket(bucket, { public: true });
    if (bucketError) {
      return NextResponse.json({ error: "Could not create storage bucket." }, { status: 500 });
    }
  }

  // Create a signed URL so the browser uploads directly to Supabase (bypasses Next.js body limits)
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUploadUrl(filename, { upsert: true });

  if (error || !data) {
    return NextResponse.json({ error: "Could not create upload URL: " + error?.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabaseAdmin.storage.from(bucket).getPublicUrl(filename);

  return NextResponse.json({ signedUrl: data.signedUrl, publicUrl });
}
