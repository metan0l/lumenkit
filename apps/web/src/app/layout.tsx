import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist_Mono, Inter, Montserrat, Onest, Oswald, Unbounded } from "next/font/google";
import { Providers } from "@/components/providers";
import { THEME_SCRIPT } from "@/lib/theme-script";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin", "cyrillic"], weight: ["400"], display: "swap" });
// Onest и шрифты ниже — «контент» пресетов (как в готовых шортсах), а не UI.
const onest = Onest({ variable: "--font-onest", subsets: ["latin", "cyrillic"], display: "swap" });
// Шрифты ниже — это «контент» пресетов (как в готовых шортсах), а не UI.
const unbounded = Unbounded({ variable: "--font-unbounded", subsets: ["latin", "cyrillic"], weight: ["700", "900"], display: "swap" });
const montserrat = Montserrat({ variable: "--font-caption-face", subsets: ["latin", "cyrillic"], weight: ["800", "900"], display: "swap" });
const oswald = Oswald({ variable: "--font-oswald", subsets: ["latin", "cyrillic"], weight: ["700"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Lumen Kit", template: "%s — Lumen Kit" },
  description: "Автомонтаж шортсов и моушен-вставки",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  colorScheme: "dark light",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} ${onest.variable} ${unbounded.variable} ${montserrat.variable} ${oswald.variable} h-full`}
    >
      <body className="min-h-full">
        {/* Тема до первой отрисовки — без вспышки тёмной у тех, кто выбрал светлую */}
        <Script id="lk-theme" strategy="beforeInteractive">
          {THEME_SCRIPT}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
