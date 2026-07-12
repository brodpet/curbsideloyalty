import type { Metadata } from "next";
import { Allura, DM_Sans, IBM_Plex_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const serif = Playfair_Display({
  variable: "--font-serif",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
});

const script = Allura({
  variable: "--font-script",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const sans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Curbside Loyalty",
  description: "Collect 10 stamps, get your next coffee on us.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${script.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
