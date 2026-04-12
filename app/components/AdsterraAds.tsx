'use client';
import { useEffect } from 'react';

interface AdsterraAdProps {
  adCode: string;
  className?: string;
  id?: string;
}

export default function AdsterraAd({ adCode, className = '', id }: AdsterraAdProps) {
  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV !== 'production') return;
    
    // Load the ad script
    const script = document.createElement('script');
    script.innerHTML = adCode;
    document.body.appendChild(script);
    
    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [adCode]);
  
  return (
    <div id={id} className={className}>
      <div dangerouslySetInnerHTML={{ __html: adCode }} />
    </div>
  );
}