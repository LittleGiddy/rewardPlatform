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
      src="https://pl31889624.profitableratecpmnetwork.com/cd/cd/a6/cdcda6a239a461180ebd8c7bbe2ae1a0.js"
    />
  );
}