'use client';
import Script from 'next/script';

export default function PopunderScript() {
  // Only run in production (not during local development)
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  return (
    <Script
      id="adsterra-popunder"
      strategy="afterInteractive"
      src="https://pl29158117.profitablecpmratenetwork.com/00/13/1c/00131cbdab924a2216b4d323b9872f62.js"
    />
  );
}