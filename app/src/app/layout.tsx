import type { Metadata } from "next";
import { Playfair_Display, Lato, Cormorant_Garamond, Cinzel } from "next/font/google";
import "./globals.css";
import { supabaseAdmin } from "@/utils/supabase/admin";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  display: "swap",
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  display: "swap",
});

const FONT_MAP: Record<string, string> = {
  "Playfair Display": "var(--font-playfair), Georgia, serif",
  "Cormorant Garamond": "var(--font-cormorant), Georgia, serif",
  "Cinzel": "var(--font-cinzel), Georgia, serif",
};

export async function generateMetadata(): Promise<Metadata> {
  const { data: config } = await supabaseAdmin
    .from("site_config")
    .select("partner_one_name, partner_two_name, cover_photo_url")
    .eq("id", 1)
    .single();

  const title =
    config?.partner_one_name && config?.partner_two_name
      ? `${config.partner_one_name} & ${config.partner_two_name}`
      : "Our Wedding";

  return {
    title,
    description: `You are cordially invited to celebrate the wedding of ${title}.`,
    icons: config?.cover_photo_url
      ? { icon: config.cover_photo_url, apple: config.cover_photo_url }
      : undefined,
    openGraph: {
      title,
      images: config?.cover_photo_url ? [config.cover_photo_url] : [],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { data: config } = await supabaseAdmin
    .from("site_config")
    .select("theme_color_primary, theme_color_secondary, theme_font")
    .eq("id", 1)
    .single();

  const primaryColor = config?.theme_color_primary ?? "#c9a96e";
  const secondaryColor = config?.theme_color_secondary ?? "#faedcd";
  const fontFamily = FONT_MAP[config?.theme_font ?? ""] ?? FONT_MAP["Playfair Display"];
  const hoverColor = `color-mix(in srgb, ${primaryColor} 85%, black)`;

  return (
    <html
      lang="en"
      className={`${playfair.variable} ${lato.variable} ${cormorant.variable} ${cinzel.variable} h-full antialiased`}
      style={{
        "--color-gold": primaryColor,
        "--color-cream-dark": secondaryColor,
        "--color-gold-hover": hoverColor,
        "--font-wedding": fontFamily,
      } as React.CSSProperties}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
