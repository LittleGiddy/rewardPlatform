'use client';
import { useEffect, useRef } from 'react';

interface AdsterraAdProps {
  adCode: string;
  className?: string;
}

export default function AdsterraAd({ adCode, className = '' }: AdsterraAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    // Only run in production and if not already loaded
    if (process.env.NODE_ENV !== 'production') return;
    if (isLoaded.current) return;
    if (!containerRef.current) return;

    // Clear previous content
    containerRef.current.innerHTML = '';
    
    // Create a wrapper for the ad
    const adWrapper = document.createElement('div');
    adWrapper.innerHTML = adCode;
    
    // Find and execute all scripts
    const scripts = adWrapper.querySelectorAll('script');
    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script');
      
      // Copy all attributes
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      
      // Copy the content
      newScript.textContent = oldScript.textContent;
      
      // Add to container
      containerRef.current?.appendChild(newScript);
    });
    
    // Add any non-script HTML
    const nonScripts = Array.from(adWrapper.childNodes).filter(
      node => node.nodeName !== 'SCRIPT'
    );
    nonScripts.forEach(node => {
      containerRef.current?.appendChild(node.cloneNode(true));
    });
    
    isLoaded.current = true;
  }, [adCode]);

  return (
    <div className={`adsterra-container ${className}`}>
      <div ref={containerRef} />
    </div>
  );
}