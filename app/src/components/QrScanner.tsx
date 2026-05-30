"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  onScan: (result: string) => void;
  active: boolean;
}

export default function QrScanner({ onScan, active }: Props) {
  const scannerRef = useRef<InstanceType<typeof import("html5-qrcode").Html5Qrcode> | null>(null);
  const isRunning = useRef(false);
  const firedRef = useRef(false);
  const onScanRef = useRef(onScan);
  const [cameraError, setCameraError] = useState("");

  // Keep onScanRef current without adding onScan to the effect deps
  onScanRef.current = onScan;

  useEffect(() => {
    if (!active) {
      firedRef.current = false;
      if (scannerRef.current && isRunning.current) {
        scannerRef.current.stop().catch(() => {});
        isRunning.current = false;
      }
      return;
    }

    firedRef.current = false;
    let cancelled = false; // guard against Strict Mode double-invoke

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (cancelled) return; // effect was cleaned up before import resolved

      const html5Qrcode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5Qrcode;

      html5Qrcode
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: (w, h) => { const size = Math.floor(Math.min(w, h) * 0.85); return { width: size, height: size }; } },
          (decodedText) => {
            if (firedRef.current) return;
            firedRef.current = true;
            html5Qrcode.stop().catch(() => {});
            isRunning.current = false;
            onScanRef.current(decodedText);
          },
          () => {}
        )
        .then(() => {
          if (cancelled) {
            html5Qrcode.stop().catch(() => {});
            return;
          }
          isRunning.current = true;
        })
        .catch((err) => {
          console.error("Camera error:", err);
          setCameraError("Akses kamera gagal. Pastikan Anda menggunakan HTTPS dan telah memberikan izin kamera.");
        });
    });

    return () => {
      cancelled = true;
      if (scannerRef.current && isRunning.current) {
        scannerRef.current.stop().catch(() => {});
        isRunning.current = false;
      }
    };
  }, [active]); // onScan intentionally excluded — accessed via ref

  return (
    <div className="rounded-2xl overflow-hidden bg-black w-full">
      {cameraError ? (
        <div className="flex items-center justify-center h-64 p-4 text-center">
          <p className="text-red-400 text-sm">{cameraError}</p>
        </div>
      ) : (
        <div id="qr-reader" className="w-full" />
      )}
    </div>
  );
}
