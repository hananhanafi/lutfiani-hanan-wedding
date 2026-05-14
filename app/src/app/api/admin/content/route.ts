import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/utils/supabase/admin";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const {
    partner_one_name, partner_two_name, wedding_date, wedding_time,
    venue_name, venue_address, venue_maps_url, dress_code, rsvp_deadline,
    cover_photo_url, story_text, gift_registry_url, travel_info,
    gift_qr_url, bank_name, bank_account_number, bank_account_name,
    theme_color_primary, theme_color_secondary, schedule_json, faq_json, gallery_photos_json,
    theme_font,
    site_password_enabled, site_password_plain,
    spotify_playlist_url,
  } = body;

  const updateData: Record<string, unknown> = {
    partner_one_name, partner_two_name,
    wedding_date: wedding_date || null,
    wedding_time: wedding_time || null,
    venue_name: venue_name || null,
    venue_address: venue_address || null,
    venue_maps_url: venue_maps_url || null,
    dress_code: dress_code || null,
    rsvp_deadline: rsvp_deadline || null,
    cover_photo_url: cover_photo_url || null,
    story_text: story_text || null,
    gift_registry_url: gift_registry_url || null,
    gift_qr_url: gift_qr_url || null,
    bank_name: bank_name || null,
    bank_account_number: bank_account_number || null,
    bank_account_name: bank_account_name || null,
    travel_info: travel_info || null,
    theme_color_primary,
    theme_color_secondary,
    theme_font: theme_font || "Playfair Display",
    schedule_json,
    faq_json,
    gallery_photos_json,
    site_password_enabled: !!site_password_enabled,
    spotify_playlist_url: spotify_playlist_url || null,
    updated_at: new Date().toISOString(),
  };

  // Hash and store the new password if provided
  if (site_password_plain) {
    updateData.site_password_hash = crypto
      .createHash("sha256")
      .update(String(site_password_plain))
      .digest("hex");
  }

  const { error } = await supabaseAdmin
    .from("site_config")
    .update(updateData)
    .eq("id", 1);

  if (error) {
    console.error("Content update error:", error);
    return NextResponse.json({ error: "Failed to save." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
