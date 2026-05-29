"use client";

import { useEffect, useRef, useState } from "react";

interface BackgroundVideoProps {
  videoUrl?: string;
  posterUrl?: string;
}

export default function BackgroundVideo({ videoUrl, posterUrl }: BackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Attempt to play; on browsers that block autoplay, handle gracefully
    video.play().catch(() => {
      // Autoplay blocked — video stays paused, poster image shows as fallback
    });
  }, [videoUrl]);

  if (!videoUrl || failed) return null;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        onError={() => setFailed(true)}
      />
      {/* Dark overlay so text sections remain readable */}
      <div className="absolute inset-0 bg-black/30" />
    </div>
  );
}
