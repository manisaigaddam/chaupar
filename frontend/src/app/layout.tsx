import { Providers } from "@/components/Providers";
import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Chaupar चौपड़ | On-Chain Card Game on Conflux",
  description: "Predict if the next card is higher or lower. 96% RTP, pure on-chain, USDT0 bets, house pool liquidity on Conflux eSpace.",
  keywords: ["chaupar", "card game", "conflux", "blockchain", "casino", "on-chain game", "usdt0", "house pool", "ganjifa"],
  authors: [{ name: "Chaupar Team" }],
  openGraph: {
    title: "Chaupar चौपड़ | On-Chain Card Game",
    description: "Pure on-chain card prediction game with 96% RTP, USDT0 bets & house pool on Conflux eSpace.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${cormorant.variable} antialiased bg-black`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
