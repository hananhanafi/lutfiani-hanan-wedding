import Link from "next/link";
import FloatingPetals from "@/components/FloatingPetals";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at 50% 40%, #2c1a0a 0%, #120a03 100%)",
        color: "#fffbf5",
        textAlign: "center",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        .btn-home {
          display: inline-block;
          padding: 10px 32px;
          background: #c9a96e;
          color: #fff;
          border-radius: 999px;
          font-size: 0.7rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          text-decoration: none;
          font-family: var(--font-lato);
          transition: background 0.2s;
        }
        .btn-home:hover { background: #b8945a; }
      `}</style>
      <FloatingPetals count={18} />

      {/* 404 number */}
      <p
        style={{
          fontFamily: "var(--font-wedding)",
          fontSize: "clamp(5rem, 22vw, 9rem)",
          lineHeight: 1,
          color: "rgba(201,169,110,0.18)",
          letterSpacing: "0.05em",
          userSelect: "none",
          margin: 0,
        }}
      >
        404
      </p>

      {/* Divider */}
      <div
        style={{
          width: 48,
          height: 1,
          background: "rgba(201,169,110,0.5)",
          margin: "0.75rem auto 1.5rem",
        }}
      />

      {/* Eyebrow */}
      <p
        style={{
          fontSize: "0.6rem",
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          color: "rgba(201,169,110,0.7)",
          fontFamily: "var(--font-lato)",
          marginBottom: "1rem",
        }}
      >
        Halaman Tidak Ditemukan
      </p>

      {/* Heading */}
      <h1
        style={{
          fontFamily: "var(--font-wedding)",
          fontSize: "clamp(1.5rem, 5vw, 2.2rem)",
          color: "#f5e9cb",
          fontWeight: 400,
          margin: "0 0 0.75rem",
          lineHeight: 1.3,
        }}
      >
        Sepertinya Anda Tersesat
      </h1>

      {/* Sub-text */}
      <p
        style={{
          color: "rgba(245,233,203,0.55)",
          fontSize: "0.85rem",
          fontFamily: "var(--font-lato)",
          maxWidth: 320,
          lineHeight: 1.6,
          margin: "0 0 2.5rem",
        }}
      >
        Halaman yang Anda cari tidak ada atau telah dipindahkan.
      </p>

      {/* Back home button */}
      <Link
        href="/"
        className="btn-home"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
