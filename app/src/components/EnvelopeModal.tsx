"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import FloatingPetals from "@/components/FloatingPetals";

interface Props {
  partnerOneName: string;
  partnerTwoName: string;
  weddingDate?: string;
  coverPhotoUrl?: string;
  spotifyPlaylistUrl?: string;
}

type Stage = "sealed" | "cracking" | "opening" | "revealed" | "leaving";

function toEmbedUrl(input: string): string | null {
  const uriMatch = input.match(/spotify:playlist:([A-Za-z0-9]+)/);
  if (uriMatch) return `https://open.spotify.com/embed/playlist/${uriMatch[1]}`;
  const urlMatch = input.match(/open\.spotify\.com\/playlist\/([A-Za-z0-9]+)/);
  if (urlMatch) return `https://open.spotify.com/embed/playlist/${urlMatch[1]}`;
  return null;
}

export default function EnvelopeModal({
  partnerOneName,
  partnerTwoName,
  weddingDate,
  spotifyPlaylistUrl,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [stage, setStage] = useState<Stage>("sealed");
  const [miniPlayer, setMiniPlayer] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const initialized = useRef(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  const embedUrl = spotifyPlaylistUrl ? toEmbedUrl(spotifyPlaylistUrl) : null;

  const formattedDate = weddingDate
    ? new Date(weddingDate).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  useEffect(() => {
    if (!sessionStorage.getItem("welcome_seen")) {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (miniPlayer && !initialized.current) {
      initialized.current = true;
      setPos({ x: window.innerWidth - 304, y: window.innerHeight - 220 });
    }
  }, [miniPlayer]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      isDragging.current = true;
      dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [pos]
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 292, e.clientX - dragOffset.current.x)),
      y: Math.max(0, Math.min(window.innerHeight - 48, e.clientY - dragOffset.current.y)),
    });
  }, []);

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleSealClick = () => {
    if (stage !== "sealed") return;
    setStage("cracking");
    setTimeout(() => setStage("opening"), 350);
    setTimeout(() => setStage("revealed"), 1500);
  };

  const handleEnter = () => {
    setStage("leaving");
    sessionStorage.setItem("welcome_seen", "1");
    if (embedUrl) setMiniPlayer(true);
    setTimeout(() => setVisible(false), 800);
  };

  return (
    <>
      <style>{`
        @keyframes envOverlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes envOverlayOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes envTitleIn {
          from { opacity: 0; transform: translateY(-12px) letterSpacing: 0.1em; }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes envSealPop {
          0%   { transform: translateX(-50%) scale(1);   opacity: 1; }
          40%  { transform: translateX(-50%) scale(1.25); opacity: 1; }
          100% { transform: translateX(-50%) scale(0);   opacity: 0; }
        }
        @keyframes envFlapOpen {
          0%   { transform: rotateX(0deg); }
          100% { transform: rotateX(-180deg); }
        }
        @keyframes envLetterRise {
          0%   { transform: translateX(-50%) translateY(10px); opacity: 0; }
          60%  { opacity: 1; }
          100% { transform: translateX(-50%) translateY(var(--letter-rise, -96px)); opacity: 1; }
        }
        @keyframes envContentIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes envHintPulse {
          0%, 100% { opacity: 0.35; }
          50%      { opacity: 0.7; }
        }
        @keyframes envSealGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(178, 34, 20, 0.5), 0 2px 12px rgba(0,0,0,0.4); }
          50%      { box-shadow: 0 0 0 8px rgba(178, 34, 20, 0), 0 2px 12px rgba(0,0,0,0.4); }
        }
        @keyframes envParticle {
          0%   { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0.8; }
          100% { transform: translateY(-120px) translateX(var(--px)) rotate(720deg); opacity: 0; }
        }

        .env-overlay-in  { animation: envOverlayIn  0.6s ease forwards; }
        .env-overlay-out { animation: envOverlayOut 0.8s ease forwards; }

        .env-seal-btn {
          animation: envSealGlow 2s ease-in-out 1s infinite;
        }
        .env-seal-btn.cracking {
          animation: envSealPop 0.35s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards;
        }

        .env-flap {
          transform-origin: 50% 0%;
          transform-style: preserve-3d;
          backface-visibility: hidden;
        }
        .env-flap.opening {
          animation: envFlapOpen 1.1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .env-letter {
          opacity: 0;
          transition: none;
        }
        .env-letter.rising {
          animation: envLetterRise 1.0s cubic-bezier(0.34, 1.2, 0.64, 1) 0.35s forwards;
        }

        .env-content {
          animation: envContentIn 0.55s ease 0.15s both;
        }
        .env-hint {
          animation: envHintPulse 2.2s ease-in-out infinite;
        }

        .env-scene {
          --env-w: min(320px, 88vw);
          --env-h: calc(var(--env-w) * 0.65625);
          --letter-w: calc(var(--env-w) * 0.8375);
          --letter-rise: calc(var(--env-h) * -0.55);
        }
      `}</style>

      {/* ── Envelope overlay ──────────────────────────────── */}
      {visible && (
        <div
          className={stage === "leaving" ? "env-overlay-out" : "env-overlay-in"}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "radial-gradient(ellipse at 50% 60%, #2c1a0a 0%, #120a03 100%)",
          }}
        >
          <FloatingPetals count={20} />

          {/* Top label */}
          <p
            style={{
              color: "rgba(201,169,110,0.7)",
              fontSize: "0.65rem",
              letterSpacing: "0.45em",
              textTransform: "uppercase",
              marginBottom: "2.5rem",
              fontFamily: "var(--font-lato)",
              animation: "envContentIn 1s ease 0.3s both",
            }}
          >
            Anda Diundang
          </p>

          {/* Envelope + letter wrapper */}
          <div className="env-scene" style={{ perspective: "700px", position: "relative" }}>
            {/* Letter card (rises from envelope — only rendered when opening starts) */}
            {(stage === "opening" || stage === "revealed") && (
            <div
              className={`env-letter${stage === "opening" || stage === "revealed" ? " rising" : ""}`}
              style={{
                position: "absolute",
                left: "50%",
                bottom: 12,
                transform: "translateX(-50%)",
                width: "var(--letter-w)",
                background: "#fffbf5",
                borderRadius: 12,
                boxShadow: "0 8px 40px rgba(0,0,0,0.35)",
                padding: "28px 24px 24px",
                textAlign: "center",
                zIndex: 6,
              }}
            >
              {stage === "revealed" && (
                <div className="env-content" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <p style={{ fontSize: "0.6rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "#c9a96e", fontFamily: "var(--font-lato)" }}>
                    Undangan Pernikahan
                  </p>
                  <div style={{ width: 32, height: 1, background: "#c9a96e", margin: "2px 0" }} />
                  <p style={{ fontFamily: "var(--font-wedding)", fontSize: "1.55rem", color: "#3a3028", lineHeight: 1.2 }}>
                    {partnerOneName}
                    <span style={{ display: "block", fontSize: "0.9rem", fontWeight: 300, opacity: 0.6, margin: "2px 0" }}>&amp;</span>
                    {partnerTwoName}
                  </p>
                  {formattedDate && (
                    <p style={{ fontSize: "0.72rem", color: "#9a7d5a", letterSpacing: "0.1em", fontFamily: "var(--font-lato)" }}>
                      {formattedDate}
                    </p>
                  )}
                  <div style={{ width: 32, height: 1, background: "#e8ddd0", margin: "4px 0" }} />
                  <button
                    onClick={handleEnter}
                    style={{
                      marginTop: 4,
                      padding: "9px 28px",
                      background: "#c9a96e",
                      color: "white",
                      border: "none",
                      borderRadius: 999,
                      fontSize: "0.7rem",
                      letterSpacing: "0.25em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      fontFamily: "var(--font-lato)",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.background = "#b8945a")}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.background = "#c9a96e")}
                  >
                    Buka Undangan
                  </button>
                </div>
              )}
            </div>
            )}

            {/* Envelope body */}
            <div
              style={{
                position: "relative",
                width: "var(--env-w)",
                height: "var(--env-h)",
                flexShrink: 0,
                transformStyle: "preserve-3d",
              }}
            >
              {/* Body base */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(160deg, #f5e9cb 0%, #ead5a0 100%)",
                  borderRadius: 6,
                  border: "1px solid rgba(193,166,103,0.5)",
                  boxShadow: "0 12px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)",
                  zIndex: 2,
                  overflow: "hidden",
                }}
              >
                {/* Left fold triangle */}
                <div style={{
                  position: "absolute", top: 0, left: 0, bottom: 0, width: "50%",
                  background: "linear-gradient(200deg, #f0ddb0 0%, #e0c88a 100%)",
                  clipPath: "polygon(0 0, 100% 50%, 0 100%)",
                }} />
                {/* Right fold triangle */}
                <div style={{
                  position: "absolute", top: 0, right: 0, bottom: 0, width: "50%",
                  background: "linear-gradient(340deg, #f0ddb0 0%, #e0c88a 100%)",
                  clipPath: "polygon(100% 0, 0 50%, 100% 100%)",
                }} />
                {/* Bottom fold triangle */}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0, height: "55%",
                  background: "linear-gradient(0deg, #e8cf90 0%, #f0ddb0 100%)",
                  clipPath: "polygon(0 100%, 50% 0%, 100% 100%)",
                }} />

                {/* Monogram in body center — visible before opening */}
                {stage === "sealed" && (
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    paddingTop: 16,
                  }}>
                    <p style={{
                      fontFamily: "var(--font-wedding)",
                      fontSize: "1.8rem",
                      color: "rgba(160,120,60,0.35)",
                      letterSpacing: "0.05em",
                    }}>
                      {(partnerOneName[0] ?? "")}&amp;{(partnerTwoName[0] ?? "")}
                    </p>
                  </div>
                )}
              </div>

              {/* Flap (top triangle — rotates open) */}
              <div
                className={`env-flap ${stage === "opening" || stage === "revealed" ? "opening" : ""}`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "52%",
                  background: "linear-gradient(180deg, #f5e9cb 0%, #e8cf90 100%)",
                  clipPath: "polygon(0 0, 100% 0, 50% 88%)",
                  zIndex: 4,
                  borderRadius: "6px 6px 0 0",
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))",
                }}
              />

              {/* Wax seal */}
              {(stage === "sealed" || stage === "cracking") && (
                <button
                  className={`env-seal-btn ${stage === "cracking" ? "cracking" : ""}`}
                  onClick={handleSealClick}
                  style={{
                    position: "absolute",
                    top: "28%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 5,
                    width: 52,
                    height: 52,
                    background: "radial-gradient(circle at 35% 35%, #d44030 0%, #8b1a10 100%)",
                    borderRadius: "50%",
                    border: "2px solid rgba(220,80,60,0.6)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(255,220,200,0.9)",
                    fontSize: "1.2rem",
                    lineHeight: 1,
                  }}
                  aria-label="Buka segel"
                >
                  ♥
                </button>
              )}
            </div>
          </div>

          {/* Hint text */}
          {stage === "sealed" && (
            <p
              className="env-hint"
              style={{
                marginTop: "2rem",
                color: "rgba(201,169,110,0.45)",
                fontSize: "0.6rem",
                letterSpacing: "0.4em",
                textTransform: "uppercase",
                fontFamily: "var(--font-lato)",
              }}
            >
              Ketuk segel untuk membuka
            </p>
          )}
        </div>
      )}

      {/* ── Draggable Spotify mini player ─────────────────── */}
      {miniPlayer && embedUrl && (
        <div
          ref={playerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{
            position: "fixed",
            left: pos.x,
            top: pos.y,
            zIndex: 300,
            width: 292,
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
            cursor: "grab",
            userSelect: "none",
            background: "#1a1a1a",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 10px",
              background: "#111",
            }}
          >
            <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", fontFamily: "var(--font-lato)" }}>
              🎵 Wedding Music
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setCollapsed((v) => !v)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "0.75rem", padding: "2px 6px" }}
              >
                {collapsed ? "▲" : "▼"}
              </button>
              <button
                onClick={() => setMiniPlayer(false)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "0.8rem", padding: "2px 6px" }}
              >
                ✕
              </button>
            </div>
          </div>
          {!collapsed && (
            <iframe
              src={`${embedUrl}?utm_source=generator&theme=0`}
              width="292"
              height="152"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              style={{ display: "block" }}
            />
          )}
        </div>
      )}
    </>
  );
}
