"use client";

import { useState } from "react";
import Image from "next/image";

interface Props {
  token: string;
  guestName: string;
  plusOneName?: string;
  checkedIn: boolean;
  qrDataUrl: string;
}

export default function GuestPassButton({ token, guestName, plusOneName, checkedIn, qrDataUrl }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Lihat pass masuk"
        title="Lihat pass masuk"
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.25rem",
          zIndex: 210,
          height: 44,
          borderRadius: 999,
          background: "linear-gradient(135deg, #c9a96e, #a07840)",
          boxShadow: "0 4px 18px rgba(193,166,103,0.55)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.45rem",
          padding: "0 1rem",
          color: "#fff",
          fontFamily: "var(--font-lato), sans-serif",
          fontSize: "0.8rem",
          fontWeight: 600,
          letterSpacing: "0.03em",
          whiteSpace: "nowrap",
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 6px 22px rgba(193,166,103,0.7)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 18px rgba(193,166,103,0.55)";
        }}
      >
        <span style={{ fontSize: "1rem", lineHeight: 1 }}>🎟️</span>
        Pass Masuk
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/50 px-4 pb-6 sm:pb-0"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-[#fffbf5] rounded-2xl shadow-2xl w-full max-w-xs text-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <p className="text-xs uppercase tracking-widest text-[var(--color-gold)] mb-1 font-[family-name:var(--font-lato)]">
                Pass Masuk
              </p>
              <h2 className="text-2xl font-[family-name:var(--font-wedding)] text-[#3a3028]">
                {guestName}
              </h2>
              {plusOneName && (
                <p className="text-sm text-[#9a7d5a] mt-0.5 font-[family-name:var(--font-lato)]">
                  + {plusOneName}
                </p>
              )}
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-[family-name:var(--font-lato)] ${
                checkedIn
                  ? "bg-green-100 text-green-700"
                  : "bg-[var(--color-cream-dark)] text-[var(--color-gold)]"
              }`}>
                {checkedIn ? "✅ Sudah Check-in" : "Pass Masuk Valid"}
              </span>
            </div>

            {/* QR */}
            {!checkedIn && (
              <div className="px-6 pb-2">
                <p className="text-xs text-[#9a7d5a] mb-3 font-[family-name:var(--font-lato)]">
                  Tunjukkan ini di pintu masuk
                </p>
                <div className="bg-white rounded-xl p-3 inline-block shadow-sm">
                  <Image
                    src={qrDataUrl}
                    alt="QR Pass Masuk"
                    width={200}
                    height={200}
                    className="rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="px-6 pb-6 pt-4 flex flex-col gap-2">
              {!checkedIn && (
                <a
                  href={qrDataUrl}
                  download="wedding-pass.png"
                  className="w-full py-2.5 bg-[var(--color-gold)] text-white rounded-xl text-sm hover:bg-[var(--color-gold-hover)] transition-colors font-[family-name:var(--font-lato)]"
                >
                  Unduh QR Code
                </a>
              )}
              <a
                href={`/pass?token=${token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 border border-[var(--color-gold)] text-[var(--color-gold)] rounded-xl text-sm hover:bg-[var(--color-cream-dark)] transition-colors font-[family-name:var(--font-lato)]"
              >
                Buka Halaman Pass ↗
              </a>
              <button
                onClick={() => setOpen(false)}
                className="w-full py-2 text-sm text-[#9a7d5a] hover:text-[#3a3028] transition-colors font-[family-name:var(--font-lato)]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
