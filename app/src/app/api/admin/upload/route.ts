import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/utils/supabase/admin";

const MAX_SIZE = 10 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const bucketName = (formData.get("bucket") as string | null) ?? "covers";
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, WebP, and GIF images are allowed" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File size must be under 10 MB" }, { status: 400 });
  }

  // Ensure bucket exists (creates it on first upload)
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  if (!buckets?.find((b) => b.name === bucketName)) {
    const { error: bucketError } = await supabaseAdmin.storage.createBucket(bucketName, { public: true });
    if (bucketError) {
      console.error("Bucket creation error:", bucketError);
      return NextResponse.json({ error: "Could not create storage bucket." }, { status: 500 });
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `${bucketName === "gallery" ? "photo" : "cover"}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(filename, buffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return NextResponse.json({ error: "Upload failed: " + uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(bucketName)
    .getPublicUrl(filename);

  return NextResponse.json({ url: publicUrl });
}
