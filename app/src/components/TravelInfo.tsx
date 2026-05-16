interface Props {
  travelInfo: string;
}

export default function TravelInfo({ travelInfo }: Props) {
  if (!travelInfo) return null;

  const paragraphs = travelInfo.split("\n").filter((p) => p.trim());

  return (
    <section id="travel" className="py-20 px-4 bg-white">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-gold)] mb-3 font-[family-name:var(--font-lato)]">
            Perjalanan &amp; Menginap
          </p>
          <h2 className="text-3xl sm:text-4xl font-[family-name:var(--font-wedding)] text-[#3a3028]">
            Getting Here
          </h2>
          <div className="w-12 h-px bg-[var(--color-gold)] mx-auto mt-4" />
        </div>

        <div className="bg-[#fffbf5] rounded-2xl p-6 sm:p-8 border border-[#e0d5c5] space-y-4 font-[family-name:var(--font-lato)] text-[#3a3028]/80 leading-relaxed">
          {paragraphs.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
