interface Props {
  venueName?: string;
  venueAddress?: string;
  mapsUrl?: string;
}

export default function VenueMap({ venueName, venueAddress, mapsUrl }: Props) {
  if (!venueAddress && !mapsUrl) return null;

  const embedSrc = mapsUrl
    ? mapsUrl
    : `https://maps.google.com/maps?q=${encodeURIComponent(venueAddress ?? "")}&output=embed`;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venueAddress ?? "")}`;

  return (
    <section id="map" className="bg-[#fffbf5] py-16 px-4 mx-auto text-center">
      <p className="text-sm uppercase tracking-widest text-[var(--color-gold)] mb-3 font-[family-name:var(--font-lato)]">
        Find Us
      </p>
      <h2 className="text-3xl sm:text-4xl font-[family-name:var(--font-wedding)] text-[#3a3028] mb-8">
        {venueName ?? "Venue"}
      </h2>

      <div className="rounded-2xl overflow-hidden shadow-md max-w-3xl mx-auto">
        <iframe
          src={embedSrc}
          width="100%"
          height="380"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Venue Map"
        />
      </div>

      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-6 px-7 py-3 bg-[var(--color-gold)] text-white rounded-full text-sm hover:bg-[var(--color-gold-hover)] transition-colors font-[family-name:var(--font-lato)]"
      >
        Get Directions →
      </a>
    </section>
  );
}
