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

function toEmbedUrl(input: string): string | null {
  const uriMatch = input.match(/spotify:playlist:([A-Za-z0-9]+)/);
  if (uriMatch) return `https://open.spotify.com/embed/playlist/${uriMatch[1]}`;
  const urlMatch = input.match(/open\.spotify\.com\/playlist\/([A-Za-z0-9]+)/);
  if (urlMatch) return `https://open.spotify.com/embed/playlist/${urlMatch[1]}`;
  return null;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

export default function WelcomeModal({ partnerOneName, partnerTwoName, weddingDate, coverPhotoUrl, spotifyPlaylistUrl }: Props) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [playMusic, setPlayMusic] = useState(false);
  const [miniPlayer, setMiniPlayer] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [entered, setEntered] = useState(false);
  const [flash, setFlash] = useState(false);

  // Drag state
  const playerRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const [pos, setPos] = useState({ x: 0, y: 0 }); // offset from default bottom-right
  const initialized = useRef(false);

  const embedUrl = spotifyPlaylistUrl ? toEmbedUrl(spotifyPlaylistUrl) : null;

  useEffect(() => {
    const seen = sessionStorage.getItem("welcome_seen");
    if (!seen) {
      setVisible(true);
    } else {
      // Restore mini-player if music was previously enabled this session
      if (sessionStorage.getItem("music_enabled") === "1") {
        setMiniPlayer(true);
      }
    }
  }, []);

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [visible]);

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setEntered(true), 30);
      return () => clearTimeout(t);
    } else {
      setEntered(false);
    }
  }, [visible]);

  // Initialize position to bottom-right corner
  useEffect(() => {
    if (miniPlayer && !initialized.current) {
      initialized.current = true;
      setPos({ x: window.innerWidth - 304, y: window.innerHeight - 220 });
    }
  }, [miniPlayer]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Only drag on the header bar, not buttons
    if ((e.target as HTMLElement).closest("button")) return;
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const newX = Math.max(0, Math.min(window.innerWidth - 292, e.clientX - dragOffset.current.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 48, e.clientY - dragOffset.current.y));
    setPos({ x: newX, y: newY });
  }, []);

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleEnter = () => {
    if (playMusic && embedUrl) {
      setMiniPlayer(true);
      sessionStorage.setItem("music_enabled", "1");
    }
    setFlash(true);
    setTimeout(() => setLeaving(true), 200);
    setTimeout(() => {
      setVisible(false);
      setFlash(false);
      sessionStorage.setItem("welcome_seen", "1");
    }, 950);
  };

  return (
    <>
      <style>{`
        @keyframes wmBgZoom {
          from { transform: scale(1); }
          to   { transform: scale(1.07); }
        }
        @keyframes wmCardIn {
          0%   { opacity: 0; transform: translateY(52px) scale(0.88); filter: blur(8px); }
          70%  { filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes wmCardOut {
          0%   { opacity: 1; transform: scale(1); filter: blur(0); }
          100% { opacity: 0; transform: scale(1.14); filter: blur(10px); }
        }
        @keyframes wmItemIn {
          0%   { opacity: 0; transform: translateY(22px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes wmOrnamentIn {
          0%   { opacity: 0; transform: scaleX(0.1); }
          100% { opacity: 1; transform: scaleX(1); }
        }
        @keyframes wmFlash {
          0%   { opacity: 0; }
          25%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes wmBtnPulse {
          0%   { box-shadow: 0 0 0 0 rgba(193,158,103,0.7); }
          70%  { box-shadow: 0 0 0 16px rgba(193,158,103,0); }
          100% { box-shadow: 0 0 0 0 rgba(193,158,103,0); }
        }
        @keyframes wmShine {
          from { left: -60%; }
          to   { left: 160%; }
        }
        .wm-shine { position: relative; overflow: hidden; }
        .wm-shine::after {
          content: '';
          position: absolute;
          top: -50%; left: -60%;
          width: 35%; height: 200%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.38), transparent);
          transform: skewX(-15deg);
          animation: wmShine 2.6s ease-in-out 2.2s infinite;
        }
      `}</style>

      {/* Modal overlay */}
      {visible && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{
            opacity: leaving ? 0 : 1,
            transition: leaving ? "opacity 0.85s ease-in" : "opacity 0.5s ease-out",
          }}
        >
          {/* Background with slow Ken Burns zoom */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              ...(coverPhotoUrl
                ? { backgroundImage: `url(${coverPhotoUrl})` }
                : { background: "linear-gradient(135deg, #3a2a1a, #6b4c2a)" }),
              animation: "wmBgZoom 14s ease-out forwards",
              transformOrigin: "center center",
            }}
          />
          {/* Dimming overlay — warms to gold on exit */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: leaving ? "rgba(255,248,220,0.45)" : "rgba(0,0,0,0.55)",
              transition: "background-color 0.85s ease-in",
            }}
          />

          <FloatingPetals count={25} />

          {/* Radial light burst on exit */}
          {flash && (
            <div
              className="absolute inset-0 z-20 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at center, rgba(255,253,235,0.97) 0%, rgba(255,248,220,0.6) 40%, transparent 70%)",
                animation: "wmFlash 0.95s ease-out forwards",
              }}
            />
          )}

          <div
            className="relative z-10 glass rounded-3xl px-10 py-12 max-w-sm w-full mx-4 text-center"
            style={
              entered
                ? leaving
                  ? { animation: "wmCardOut 0.75s cubic-bezier(0.4,0,1,1) forwards" }
                  : { animation: "wmCardIn 1s cubic-bezier(0.2,0,0,1) forwards" }
                : { opacity: 0 }
            }
          >
            <div
              className="flex items-center justify-center gap-3 mb-6"
              style={entered ? { animation: "wmOrnamentIn 0.9s ease-out 0.2s both" } : { opacity: 0 }}
            >
              <div className="h-px w-10 bg-[var(--color-gold)]" />
              <span className="text-[var(--color-gold)] text-lg">✦</span>
              <div className="h-px w-10 bg-[var(--color-gold)]" />
            </div>

            <p
              className="text-xs uppercase tracking-[0.3em] text-[var(--color-gold)] mb-4 font-[family-name:var(--font-lato)]"
              style={entered ? { animation: "wmItemIn 0.7s ease-out 0.38s both" } : { opacity: 0 }}
            >
              You are invited to
            </p>
            <h1
              className="text-4xl font-[family-name:var(--font-wedding)] text-[#3a3028] leading-tight mb-1"
              style={entered ? { animation: "wmItemIn 0.7s ease-out 0.52s both" } : { opacity: 0 }}
            >{partnerOneName}</h1>
            <p
              className="text-xl font-[family-name:var(--font-wedding)] text-[#9a7d5a] mb-1"
              style={entered ? { animation: "wmItemIn 0.6s ease-out 0.66s both" } : { opacity: 0 }}
            >&amp;</p>
            <h1
              className="text-4xl font-[family-name:var(--font-wedding)] text-[#3a3028] leading-tight mb-6"
              style={entered ? { animation: "wmItemIn 0.7s ease-out 0.76s both" } : { opacity: 0 }}
            >{partnerTwoName}</h1>
            <p
              className="text-sm text-[#3a3028]/60 font-[family-name:var(--font-wedding)] italic mb-1"
              style={entered ? { animation: "wmItemIn 0.7s ease-out 0.88s both" } : { opacity: 0 }}
            >Wedding Celebration</p>
            {weddingDate && (
              <p
                className="text-xs text-[#9a7d5a] font-[family-name:var(--font-lato)] tracking-wide mb-6"
                style={entered ? { animation: "wmItemIn 0.7s ease-out 0.98s both" } : { opacity: 0 }}
              >{formatDate(weddingDate)}</p>
            )}

            {embedUrl && (
              <button
                type="button"
                onClick={() => setPlayMusic((v) => !v)}
                className={`flex items-center justify-center gap-2 w-full py-2.5 mb-4 rounded-full border text-sm font-[family-name:var(--font-lato)] transition-colors ${
                  playMusic
                    ? "border-[var(--color-gold)] bg-[var(--color-gold)] text-white"
                    : "border-[#c9b99a] text-[#9a7d5a] hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]"
                }`}
                style={entered ? { animation: "wmItemIn 0.7s ease-out 1.08s both" } : { opacity: 0 }}
              >
                🎵 {playMusic ? "Music will play" : "Play background music"}
              </button>
            )}

            <div
              className="flex items-center justify-center gap-3 mb-6"
              style={entered ? { animation: "wmOrnamentIn 0.9s ease-out 1.14s both" } : { opacity: 0 }}
            >
              <div className="h-px w-10 bg-[var(--color-gold)]" />
              <span className="text-[var(--color-gold)] text-sm">✶</span>
              <div className="h-px w-10 bg-[var(--color-gold)]" />
            </div>

            <div style={entered ? { animation: "wmItemIn 0.7s ease-out 1.22s both" } : { opacity: 0 }}>
              <button
                onClick={handleEnter}
                className="wm-shine w-full py-3 bg-[var(--color-gold)] text-white rounded-full text-sm tracking-widest uppercase font-[family-name:var(--font-lato)] hover:bg-[var(--color-gold-hover)] transition-colors"
                style={entered ? { animation: "wmBtnPulse 2s ease-out 1.8s infinite" } : {}}
              >
                Open Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Draggable mini-player */}
      {miniPlayer && embedUrl && (
        <>
          {/* Show button when hidden */}
          {hidden && (
            <button
              onClick={() => setHidden(false)}
              className="fixed bottom-4 right-4 z-[90] glass px-3 py-2 flex items-center gap-2 text-[#9a7d5a] text-xs font-[family-name:var(--font-lato)] rounded-full hover:text-[var(--color-gold)] transition-colors shadow-lg"
            >
              🎵 Music
            </button>
          )}

          {/* Player */}
          {!hidden && (
            <div
              ref={playerRef}
              className="fixed z-[90] shadow-2xl rounded-2xl overflow-hidden select-none"
              style={{ left: pos.x, top: pos.y, width: collapsed ? "auto" : 288 }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              {/* Drag handle / header */}
              <div className="glass flex items-center justify-between px-3 py-2 cursor-grab active:cursor-grabbing">
                <span className="text-xs text-[#9a7d5a] font-[family-name:var(--font-lato)] pointer-events-none">🎵 Now Playing</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCollapsed((v) => !v)}
                    className="w-6 h-6 flex items-center justify-center text-[#c9b99a] hover:text-[#9a7d5a] transition-colors text-sm"
                    aria-label={collapsed ? "Expand" : "Collapse"}
                  >
                    {collapsed ? "▲" : "▼"}
                  </button>
                  <button
                    onClick={() => setHidden(true)}
                    className="w-6 h-6 flex items-center justify-center text-[#c9b99a] hover:text-red-400 transition-colors text-sm"
                    aria-label="Hide player"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Iframe — always mounted, hidden when collapsed to keep music playing */}
              <div style={{ display: collapsed ? "none" : "block" }}>
                <iframe
                  title="Wedding Playlist"
                  src={`${embedUrl}?utm_source=generator&theme=0&autoplay=1`}
                  width="288"
                  height="152"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="eager"
                  style={{ border: "none", display: "block" }}
                />
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
