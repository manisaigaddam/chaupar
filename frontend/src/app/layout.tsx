import { Providers } from "@/components/Providers";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chaupar | On-Chain Card Game on Conflux",
  description: "Predict if the next card is higher or lower. 96% RTP, pure on-chain, provably fair on Conflux eSpace.",
  keywords: ["chaupar", "card game", "conflux", "blockchain", "casino", "on-chain game", "defi"],
  authors: [{ name: "Chaupar Team" }],
  openGraph: {
    title: "Chaupar | On-Chain Card Game",
    description: "Pure on-chain card prediction game with 96% RTP on Conflux eSpace.",
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
      <body className={`${inter.variable} antialiased bg-black`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
