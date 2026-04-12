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
    script.src = 'https://pl29131327.profitablecpmratenetwork.com/53fcb9e75a8418e03d812bfaa46c2f3d/invoke.js';
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    
    // Create the container div that the script expects
    const containerDiv = document.createElement('div');
    containerDiv.id = 'container-53fcb9e75a8418e03d812bfaa46c2f3d';
    
    // Append elements in the correct order
    containerRef.current.appendChild(containerDiv);
    containerRef.current.appendChild(script);
    
    isAdLoaded.current = true;
    console.log('Adsterra hero script injected');
  }, []);

  return <div ref={containerRef} className="flex justify-center my-2" />;
}