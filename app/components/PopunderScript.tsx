'use client';
import Script from 'next/script';
import { usePathname } from 'next/navigation';

export default function PopunderScript() {
  const pathname = usePathname();
  
  // Check if current route is admin
  const isAdminRoute = pathname?.startsWith('/admin');
  
  // Don't load on admin routes
  if (isAdminRoute) return null;
  
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