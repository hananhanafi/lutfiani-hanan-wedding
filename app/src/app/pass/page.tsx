import { supabaseAdmin } from "@/utils/supabase/admin";
import Link from "next/link";
import Image from "next/image";
import { generatePassQrDataUrl, buildPassUrl } from "@/lib/qrcode";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function PassPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return <ErrorScreen message="Token tidak ditemukan." />;
  }

  const { data: adminGuest } = await supabaseAdmin
    .from("guests")
    .select("name, attending, plus_one_name, checked_in")
    .eq("token", token)
    .maybeSingle();

  const guest = adminGuest ?? (await supabaseAdmin
    .from("rsvp_submissions")
    .select("name, attending, plus_one_name, checked_in")
    .eq("token", token)
    .maybeSingle()
  ).data;

  if (!guest) {
    return <ErrorScreen message="QR code ini tidak valid." />;
  }

  if (!guest.attending) {
    return <ErrorScreen message="Pass ini milik tamu yang tidak bisa hadir." />;
  }

  const qrUrl = buildPassUrl(token);
  const qrDataUrl = await generatePassQrDataUrl(qrUrl);

  return (
    <div className="min-h-screen bg-[#fffbf5] flex items-center justify-center px-4 py-10">
      <div className="max-w-sm w-full text-center">
        <div className="text-5xl mb-4">🎊</div>
        <h1 className="text-3xl font-[family-name:var(--font-wedding)] text-[#3a3028] mb-2">
          {guest.name}
        </h1>
        {guest.plus_one_name && (
          <p className="text-[#9a7d5a] mb-1 font-[family-name:var(--font-lato)]">
            + {guest.plus_one_name}
          </p>
        )}
        <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-[family-name:var(--font-lato)] mb-6 ${
          guest.checked_in
            ? "bg-green-100 text-green-700"
            : "bg-[var(--color-cream-dark)] text-[var(--color-gold)]"
        }`}>
          {guest.checked_in ? "✅ Sudah Check-in" : "Pass Masuk Valid"}
        </div>

        {!guest.checked_in && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
            <p className="text-xs uppercase tracking-widest text-[var(--color-gold)] mb-3 font-[family-name:var(--font-lato)]">
              Tunjukkan ini di pintu masuk
            </p>
            <Image
              src={qrDataUrl}
              alt="Entry QR Code"
              width={240}
              height={240}
              className="mx-auto rounded-xl"
            />
            <p className="text-xs text-[#9a7d5a] mt-3 font-[family-name:var(--font-lato)]">
              Screenshot dan simpan pass ini
            </p>
            <a
              href={qrDataUrl}
              download="my-wedding-pass.png"
              className="inline-block mt-4 px-6 py-2.5 bg-[var(--color-gold)] text-white rounded-xl text-sm hover:bg-[var(--color-gold-hover)] transition-colors font-[family-name:var(--font-lato)]"
            >
              Unduh QR Code
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#fffbf5] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-5xl mb-4">❌</div>
        <h1 className="text-2xl font-[family-name:var(--font-wedding)] text-[#3a3028] mb-2">Pass Tidak Valid</h1>
        <p className="text-[#9a7d5a] font-[family-name:var(--font-lato)]">{message}</p>
        <Link href="/" className="inline-block mt-6 text-sm text-[var(--color-gold)] underline font-[family-name:var(--font-lato)]">
          Ke Halaman Undangan
        </Link>
      </div>
    </div>
  );
}
