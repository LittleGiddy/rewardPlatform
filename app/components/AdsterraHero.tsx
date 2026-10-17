'use client';
import { useEffect, useRef } from 'react';

export default function AdsterraHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isAdLoaded = useRef(false);

  useEffect(() => {
    // Only run in production and if not already loaded
    if (process.env.NODE_ENV !== 'production') return;
    if (!containerRef.current || isAdLoaded.current) return;

    // Clear any existing content
    containerRef.current.innerHTML = '';

    // Create the main ad script
    const script = document.createElement('script');
    script.src = 'https://pl31889625.profitableratecpmnetwork.com/f4c39acf32779c08e2e9c47256dbb971/invoke.js';
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    
    // Create the container div that the script expects
    const containerDiv = document.createElement('div');
    containerDiv.id = 'container-f4c39acf32779c08e2e9c47256dbb971';
    
    // Append elements in the correct order
    containerRef.current.appendChild(containerDiv);
    containerRef.current.appendChild(script);
    
    isAdLoaded.current = true;
    console.log('Adsterra hero script injected');
  }, []);

  return <div ref={containerRef} className="adsterra-container flex justify-center my-2 min-h-[90px] w-full" />;
}