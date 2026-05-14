interface Props {
  playlistUrl: string;
}

/**
 * Converts any Spotify playlist URL or URI to the embed URL.
 * Accepts:
 *   https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
 *   spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
 */
function toEmbedUrl(input: string): string | null {
  try {
    // Handle spotify: URI
    const uriMatch = input.match(/spotify:playlist:([A-Za-z0-9]+)/);
    if (uriMatch) return `https://open.spotify.com/embed/playlist/${uriMatch[1]}`;

    // Handle open.spotify.com URL
    const urlMatch = input.match(/open\.spotify\.com\/playlist\/([A-Za-z0-9]+)/);
    if (urlMatch) return `https://open.spotify.com/embed/playlist/${urlMatch[1]}`;

    return null;
  } catch {
    return null;
  }
}

export default function SpotifyPlayer({ playlistUrl }: Props) {
  const embedUrl = toEmbedUrl(playlistUrl);
  if (!embedUrl) return null;

  return (
    <section id="music" className="py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-gold)] mb-3 font-[family-name:var(--font-lato)]">
            Our Playlist
          </p>
          <h2 className="text-3xl sm:text-4xl font-[family-name:var(--font-wedding)] text-[#3a3028]">
            Music for the Celebration
          </h2>
          <div className="w-12 h-px bg-[var(--color-gold)] mx-auto mt-4" />
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <iframe
            title="Wedding Playlist"
            src={`${embedUrl}?utm_source=generator&theme=0&autoplay=1`}
            width="100%"
            height="380"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            style={{ border: "none" }}
          />
        </div>
      </div>
    </section>
  );
}
