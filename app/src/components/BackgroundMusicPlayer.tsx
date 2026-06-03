"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Props {
  mp3Url?: string;
  youtubeUrl?: string;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

export default function BackgroundMusicPlayer({ mp3Url, youtubeUrl }: Props) {
  const mode = mp3Url ? "mp3" : youtubeUrl ? "youtube" : null;
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ytPlayerRef = useRef<any>(null);
  const ytReadyRef = useRef(false);
  const shouldPlayRef = useRef(false);

  const startPlaying = useCallback(() => {
    if (mode === "mp3" && audioRef.current) {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
    } else if (mode === "youtube") {
      shouldPlayRef.current = true;
      if (ytReadyRef.current && ytPlayerRef.current) {
        ytPlayerRef.current.playVideo();
        setPlaying(true);
      }
    }
  }, [mode]);

  // Always show the button when music is configured; autoplay on envelope open
  useEffect(() => {
    if (!mode) return;
    setVisible(true);

    // Attempt immediate autoplay (works if browser allows or user already interacted)
    startPlaying();

    // Also fire when envelope "Open Invitation" is clicked
    const handleOpen = () => startPlaying();
    window.addEventListener("wedding:open", handleOpen);
    return () => window.removeEventListener("wedding:open", handleOpen);
  }, [mode, startPlaying]);

  // YouTube IFrame API setup
  useEffect(() => {
    if (mode !== "youtube" || !youtubeUrl) return;
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) return;

    const initPlayer = () => {
      const div = document.createElement("div");
      div.id = "yt-bg-player";
      div.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;";
      document.body.appendChild(div);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ytPlayerRef.current = new (window as any).YT.Player("yt-bg-player", {
        videoId,
        playerVars: { autoplay: 0, controls: 0, loop: 1, playlist: videoId, enablejsapi: 1 },
        events: {
          onReady: () => {
            ytReadyRef.current = true;
            ytPlayerRef.current.setVolume(70);
            if (shouldPlayRef.current) {
              ytPlayerRef.current.playVideo();
              setPlaying(true);
            }
          },
        },
      });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).YT?.Player) {
      initPlayer();
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prev = (window as any).onYouTubeIframeAPIReady;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).onYouTubeIframeAPIReady = () => {
        prev?.();
        initPlayer();
      };
      if (!document.getElementById("yt-api-script")) {
        const script = document.createElement("script");
        script.id = "yt-api-script";
        script.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(script);
      }
    }

    return () => {
      ytPlayerRef.current?.destroy?.();
      document.getElementById("yt-bg-player")?.remove();
    };
  }, [mode, youtubeUrl]);

  const toggle = () => {
    if (mode === "mp3" && audioRef.current) {
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
      } else {
        audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
      }
    } else if (mode === "youtube" && ytPlayerRef.current) {
      if (playing) {
        ytPlayerRef.current.pauseVideo();
        setPlaying(false);
      } else {
        ytPlayerRef.current.playVideo();
        setPlaying(true);
      }
    }
  };

  if (!mode) return null;

  return (
    <>
      {mode === "mp3" && mp3Url && (
        <audio ref={audioRef} src={mp3Url} loop preload="auto" />
      )}
      {visible && (
        <button
          onClick={toggle}
          className="fixed bottom-6 right-6 z-[80] glass w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 text-lg"
          aria-label={playing ? "Matikan musik" : "Putar musik"}
          title={playing ? "Matikan musik" : "Putar musik"}
        >
          {playing ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[var(--color-gold)]">
              <path d="M19.952 1.651a.75.75 0 0 1 .298.599V16.303a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.403-4.909l2.311-.66a1.5 1.5 0 0 0 1.088-1.442V6.994l-9 2.572v9.737a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.402-4.909l2.31-.66A1.5 1.5 0 0 0 8.25 15.5V5.251a.75.75 0 0 1 .544-.721l10.5-3a.75.75 0 0 1 .658.121Z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#9a7d5a]/60">
              <path d="M19.952 1.651a.75.75 0 0 1 .298.599V16.303a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.403-4.909l2.311-.66a1.5 1.5 0 0 0 1.088-1.442V6.994l-9 2.572v9.737a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.402-4.909l2.31-.66A1.5 1.5 0 0 0 8.25 15.5V5.251a.75.75 0 0 1 .544-.721l10.5-3a.75.75 0 0 1 .658.121Z" />
            </svg>
          )}
        </button>
      )}
    </>
  );
}
