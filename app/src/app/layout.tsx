import type { Metadata } from "next";
import { Playfair_Display, Lato, Cormorant_Garamond, Cinzel, Great_Vibes } from "next/font/google";
import "./globals.css";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import { LanguageProvider } from "@/components/LanguageProvider";
import LanguageToggle from "@/components/LanguageToggle";

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

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  subsets: ["latin"],
  weight: "400",
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
      suppressHydrationWarning
      className={`${playfair.variable} ${lato.variable} ${cormorant.variable} ${cinzel.variable} ${greatVibes.variable} h-full antialiased`}
      style={{
        "--color-gold": primaryColor,
        "--color-cream-dark": secondaryColor,
        "--color-gold-hover": hoverColor,
        "--font-wedding": fontFamily,
      } as React.CSSProperties}
    >
      <head>
        {/* Anti-flash: apply saved theme before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme')||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){}`,
          }}
        />
        <meta name="facebook-domain-verification" content="ixd2nuvhf3nhulxsw9j1hry6v8i9rj" />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider>
          <LanguageProvider>
            {children}
            <ThemeToggle />
            <LanguageToggle />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
