interface Props {
  storyText: string;
  partnerOneName: string;
  partnerTwoName: string;
}

export default function OurStory({ storyText, partnerOneName, partnerTwoName }: Props) {
  if (!storyText) return null;

  const paragraphs = storyText.split("\n").filter((p) => p.trim());

  return (
    <section id="story" className="glass-bg py-20 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-gold)] mb-3 font-[family-name:var(--font-lato)]">
          Kisah Kami
        </p>
        <h2 className="text-3xl sm:text-4xl font-[family-name:var(--font-wedding)] text-[#3a3028] mb-4">
          {partnerOneName} &amp; {partnerTwoName}
        </h2>
        <div className="w-12 h-px bg-[var(--color-gold)] mx-auto mb-8" />

        <div className="glass rounded-2xl px-8 py-6 mt-2 space-y-5 text-[#3a3028]/80 leading-relaxed font-[family-name:var(--font-lato)] text-base sm:text-lg text-left">
          {paragraphs.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
