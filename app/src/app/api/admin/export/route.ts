import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/utils/supabase/admin";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: guests } = await supabaseAdmin
    .from("guests")
    .select("*")
    .order("submitted_at", { ascending: false });

  if (!guests) return NextResponse.json({ error: "No data" }, { status: 500 });

  const headers = ["Name", "Email", "Attending", "Plus One", "Group", "Side", "Message", "Submitted At", "Checked In", "Checked In At"];

  const rows = guests.map((g) => [
    g.name,
    g.email ?? "",
    g.attending === true ? "Yes" : g.attending === false ? "No" : "Pending",
    g.plus_one_name ?? "",
    g.group_name ?? "",
    g.side ?? "",
    (g.message ?? "").replace(/,/g, ";"),
    g.submitted_at,
    g.checked_in ? "Yes" : "No",
    g.checked_in_at ?? "",
  ]);

  const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="rsvp-list-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
