/**
 * Migration script: Move all media from Supabase Storage to Cloudflare R2
 * 
 * Run with: npx tsx scripts/migrate-to-r2.ts
 */

import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import path from "path";
import ws from "ws";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { realtime: { transport: ws as any } }
);

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET || "mywedding";
const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL!.replace(/\/$/, "");
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// All known storage buckets
const BUCKETS = ["covers", "gallery", "videos", "audio"];

interface MigratedFile {
  bucket: string;
  filename: string;
  oldUrl: string;
  newUrl: string;
}

async function listBucketFiles(bucket: string): Promise<string[]> {
  const { data, error } = await supabase.storage.from(bucket).list("", { limit: 1000 });
  if (error) {
    console.log(`  ⚠ Bucket "${bucket}" not found or empty: ${error.message}`);
    return [];
  }
  return (data || []).filter((f) => f.name && !f.name.startsWith(".")).map((f) => f.name);
}

async function downloadFile(bucket: string, filename: string): Promise<Buffer | null> {
  const { data, error } = await supabase.storage.from(bucket).download(filename);
  if (error || !data) {
    console.log(`  ⚠ Failed to download ${bucket}/${filename}: ${error?.message}`);
    return null;
  }
  return Buffer.from(await data.arrayBuffer());
}

async function uploadToR2(buffer: Buffer, key: string, contentType: string): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return `${R2_PUBLIC_URL}/${key}`;
}

function guessContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
    webp: "image/webp", gif: "image/gif",
    mp4: "video/mp4", webm: "video/webm", ogg: "video/ogg", mov: "video/quicktime",
    mp3: "audio/mpeg", wav: "audio/wav", flac: "audio/flac",
  };
  return map[ext] || "application/octet-stream";
}

async function updateSiteConfig(migrated: MigratedFile[]) {
  if (migrated.length === 0) return;

  // Build URL mapping: old Supabase URL → new R2 URL
  const urlMap = new Map<string, string>();
  for (const f of migrated) {
    urlMap.set(f.oldUrl, f.newUrl);
  }

  // Fetch current site_config
  const { data: config, error } = await supabase.from("site_config").select("*").eq("id", 1).single();
  if (error || !config) {
    console.log("\n⚠ Could not fetch site_config to update URLs:", error?.message);
    return;
  }

  const urlFields = [
    "cover_photo_url", "cover_video_url",
    "partner_one_photo_url", "partner_two_photo_url",
    "gift_qr_url", "background_music_url",
  ];

  const updates: Record<string, string> = {};
  for (const field of urlFields) {
    const val = config[field];
    if (val && urlMap.has(val)) {
      updates[field] = urlMap.get(val)!;
    }
  }

  // Handle gallery_photos_json array
  if (config.gallery_photos_json && Array.isArray(config.gallery_photos_json)) {
    const newGallery = config.gallery_photos_json.map((url: string) => urlMap.get(url) || url);
    if (JSON.stringify(newGallery) !== JSON.stringify(config.gallery_photos_json)) {
      updates["gallery_photos_json"] = newGallery;
    }
  }

  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await supabase
      .from("site_config")
      .update(updates)
      .eq("id", 1);
    if (updateError) {
      console.log("\n⚠ Failed to update site_config:", updateError.message);
    } else {
      console.log(`\n✅ Updated site_config — ${Object.keys(updates).length} URL(s) replaced:`);
      for (const [field, url] of Object.entries(updates)) {
        if (typeof url === "string") console.log(`   ${field} → ${url}`);
        else console.log(`   ${field} → [array updated]`);
      }
    }
  } else {
    console.log("\nℹ No site_config URLs needed updating.");
  }
}

async function main() {
  console.log("🚀 Starting Supabase → Cloudflare R2 migration\n");
  console.log(`   R2 Bucket: ${R2_BUCKET}`);
  console.log(`   R2 Public: ${R2_PUBLIC_URL}\n`);

  const migrated: MigratedFile[] = [];

  for (const bucket of BUCKETS) {
    console.log(`📁 Bucket: ${bucket}`);
    const files = await listBucketFiles(bucket);
    if (files.length === 0) {
      console.log("   (empty)\n");
      continue;
    }
    console.log(`   Found ${files.length} file(s)`);

    for (const filename of files) {
      const buffer = await downloadFile(bucket, filename);
      if (!buffer) continue;

      const key = `${bucket}/${filename}`;
      const contentType = guessContentType(filename);

      try {
        const newUrl = await uploadToR2(buffer, key, contentType);
        const oldUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filename}`;
        migrated.push({ bucket, filename, oldUrl, newUrl });
        console.log(`   ✅ ${filename} (${(buffer.length / 1024).toFixed(0)} KB) → ${newUrl}`);
      } catch (err) {
        console.log(`   ❌ ${filename}: ${err instanceof Error ? err.message : err}`);
      }
    }
    console.log();
  }

  console.log(`\n📊 Migrated ${migrated.length} file(s) total.`);

  // Update site_config URLs in the database
  await updateSiteConfig(migrated);

  console.log("\n🎉 Migration complete!");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
