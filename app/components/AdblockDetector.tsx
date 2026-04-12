'use client';
import { useState, useEffect } from 'react';

export default function AdblockDetector() {
  const [adblockDetected, setAdblockDetected] = useState(false);

  useEffect(() => {
    const checkAdblock = async () => {
      try {
        // Create a test ad element
        const testAd = document.createElement('div');
        testAd.className = 'adsbox';
        testAd.style.display = 'none';
        document.body.appendChild(testAd);
        
        // Check if it was blocked
        const isBlocked = testAd.offsetHeight === 0;
        document.body.removeChild(testAd);
        
        setAdblockDetected(isBlocked);
      } catch (error) {
        setAdblockDetected(true);
      }
    };
    
    checkAdblock();
  }, []);

  if (!adblockDetected) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-2xl font-bold text-red-600 mb-4">AdBlocker Detected!</h2>
        <p className="text-gray-600 mb-6">
          Vuna Vocha is FREE because of ads. Please disable your ad blocker to continue and win vouchers!
        </p>
        <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
          <p className="font-semibold mb-2">How to disable:</p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>Click the puzzle piece icon in your browser</li>
            <li>Find your ad blocker (AdBlock, uBlock Origin, etc.)</li>
            <li>Click "Pause on this site" or "Don't run on this page"</li>
            <li>Refresh the page</li>
          </ol>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          🔄 I've Disabled AdBlocker - Refresh
        </button>
      </div>
    </div>
  );
}