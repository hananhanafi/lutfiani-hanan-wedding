import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { generatePassQrDataUrl, buildPassUrl } from "@/lib/qrcode";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get("ids");
  const ids = idsParam ? idsParam.split(",").filter(Boolean) : null;

  let query = supabaseAdmin
    .from("guests")
    .select("id, name, plus_one_name, group_name, side, token")
    .order("name");

  if (ids && ids.length > 0) {
    query = query.in("id", ids);
  }

  const { data: guests, error } = await query;

  if (error || !guests) {
    return NextResponse.json({ error: "Failed to fetch guests." }, { status: 500 });
  }

  // Generate QR codes in parallel
  const cardsHtml = await Promise.all(
    guests.map(async (g) => {
      const passUrl = buildPassUrl(g.token);
      const qrDataUrl = await generatePassQrDataUrl(passUrl);
      const sideLabel =
        g.side === "bride" ? "Mempelai Wanita" : g.side === "groom" ? "Mempelai Pria" : "";
      const meta = [g.group_name, sideLabel].filter(Boolean).map(escapeHtml).join(" · ");

      return `
        <div class="card">
          <div class="ornament">L ♥ H</div>
          <div class="card-name">${escapeHtml(g.name)}</div>
          <img class="card-qr" src="${qrDataUrl}" alt="QR Code ${escapeHtml(g.name)}" />
          <div class="card-instruction">Tunjukkan ini di pintu masuk</div>
        </div>`;
    })
  );

  const totalLabel = ids ? `${guests.length} tamu terpilih` : `${guests.length} tamu`;
  const dateLabel = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>QR Code Tamu — ${dateLabel}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, 'Times New Roman', serif; background: #f9f5ef; color: #3a3028; }

    /* ── Print header (hidden when printing) ── */
    .page-header {
      text-align: center;
      padding: 20px 24px 16px;
      background: #fff;
      border-bottom: 1px solid #e8ddd0;
      margin-bottom: 20px;
    }
    .page-header h1 { font-size: 22px; color: #3a3028; margin-bottom: 4px; }
    .page-header p  { font-size: 13px; color: #9a7d5a; margin-bottom: 14px; }
    .print-btn {
      display: inline-block;
      padding: 10px 32px;
      background: #c1a667;
      color: #fff;
      border: none;
      border-radius: 99px;
      cursor: pointer;
      font-size: 14px;
      letter-spacing: 0.06em;
      font-family: inherit;
    }
    .print-btn:hover { background: #a8904e; }

    /* ── Grid ── */
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6mm;
      padding: 6mm;
    }

    /* ── Card ── */
    .card {
      background: #fff;
      border: 1.5px dashed #c9b99a;
      border-radius: 10px;
      padding: 7mm 5mm 5mm;
      text-align: center;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .ornament {
      font-size: 12px;
      color: #c9b99a;
      margin-bottom: 3mm;
    }
    .card-name {
      font-size: 15px;
      font-weight: 700;
      color: #3a3028;
      line-height: 1.3;
      margin-bottom: 1.5mm;
    }
    .card-plus-one {
      font-size: 10px;
      color: #9a7d5a;
      margin-bottom: 1mm;
    }
    .card-meta {
      font-size: 9.5px;
      color: #c9b99a;
      margin-bottom: 3mm;
    }
    .card-qr {
      width: 52mm;
      height: 52mm;
      display: block;
      margin: 0 auto 3mm;
    }
    .card-instruction {
      font-size: 9px;
      color: #9a7d5a;
      font-style: italic;
    }

    /* ── Print overrides ── */
    @media print {
      @page { size: A4 portrait; margin: 8mm; }
      body { background: #fff; }
      .no-print { display: none !important; }
      .grid { padding: 0; gap: 5mm; }
    }
  </style>
</head>
<body>
  <div class="page-header no-print">
    <h1>QR Code Tamu</h1>
    <p>${totalLabel} &nbsp;·&nbsp; ${dateLabel}</p>
    <button class="print-btn" onclick="window.print()">🖨️ Print / Simpan PDF</button>
  </div>

  <div class="grid">
    ${cardsHtml.join("\n")}
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
