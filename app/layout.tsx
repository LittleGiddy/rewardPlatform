import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AdblockDetector from "./components/AdblockDetector";
import PopunderScript from "./components/PopunderScript";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// IMPORTANT: Add metadataBase for absolute URLs
export const metadata: Metadata = {
  metadataBase: new URL("https://reward-platform-black.vercel.app"),
  title: "Vuna Vocha - Shinda Vocha za TZS!",
  description: "Kwangua, shiriki, na shinda vocha za TZS kutoka Vodacom, Airtel, Yas, Halotel. Nafasi ya kushinda kila siku!",
  keywords: "vocha, zawadi, Tanzania, shinda pesa, Vuna Vocha, scratch card, vocha za simu",
  authors: [{ name: "Vuna Vocha" }],
  openGraph: {
    title: "Vuna Vocha - Shinda Vocha za TZS!",
    description: "Kwangua kadi yako, shiriki kwa marafiki, na shinda vocha za kweli! Nafasi ya kushinda kila siku.",
    url: "https://reward-platform-black.vercel.app",
    siteName: "Vuna Vocha",
    locale: "sw_TZ",
    type: "website",
    images: [
      {
        url: "/vuna.jpg",
        width: 1200,
        height: 630,
        alt: "Vuna Vocha - Shinda Vocha za TZS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vuna Vocha - Shinda Vocha za TZS!",
    description: "Kwangua, shiriki, na shinda vocha za TZS! Nafasi ya kushinda kila siku.",
    images: ["/vuna.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sw">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <PopunderScript />
        <AdblockDetector />
      </body>
    </html>
  );
}