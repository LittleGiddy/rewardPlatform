'use client';
import { useState, useEffect } from 'react';

export default function AdblockDetector() {
  const [adblockDetected, setAdblockDetected] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdblock = async () => {
      // Method 1: Fetch a known ad script
      const testUrl = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      
      try {
        // Try to fetch Google AdSense script (commonly blocked)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        await fetch(testUrl, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // If fetch doesn't error, ad blocker might not be blocking
        // But we need a second check to be sure
        
        // Method 2: Check for blocked DOM element
        const bait = document.createElement('div');
        bait.className = 'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links';
        bait.style.cssText = 'position: absolute; left: -9999px; top: -9999px; height: 1px; width: 1px;';
        bait.innerHTML = '&nbsp;';
        document.body.appendChild(bait);
        
        // Use requestAnimationFrame to ensure DOM update
        requestAnimationFrame(() => {
          const isBlocked = bait.offsetHeight === 0 || bait.offsetWidth === 0;
          document.body.removeChild(bait);
          setAdblockDetected(isBlocked);
        });
        
      } catch (error) {
        // Fetch failed - likely blocked by ad blocker
        setAdblockDetected(true);
      }
    };
    
    // Delay check to ensure page is fully loaded
    const timer = setTimeout(checkAdblock, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Don't show anything while checking
  if (adblockDetected === null) {
    return null;
  }

  if (!adblockDetected) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-2xl font-bold text-red-600 mb-4">AdBlocker Detected!</h2>
        <p className="text-gray-600 mb-6">
          Vuna Vocha is FREE because of ads. Please disable your ad blocker to continue and win vouchers!
        </p>
        <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
          <p className="font-semibold mb-2 text-gray-800">How to disable:</p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>Click the puzzle piece icon (extensions) in your browser toolbar</li>
            <li>Find your ad blocker (AdBlock, uBlock Origin, AdBlock Plus, etc.)</li>
            <li>Click &quot;Pause on this site&quot; or &quot;Don&apos;t run on this page&quot;</li>
            <li>Refresh the page by clicking the button below</li>
          </ol>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          🔄 I&apos;ve Disabled AdBlocker - Refresh
        </button>
      </div>
    </div>
  );
}