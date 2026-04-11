'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

export default function WinnerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  
  const amount = searchParams.get('amount');
  const voucherCode = searchParams.get('code');

  // Only run confetti on client-side after mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.5, x: 0.3 } });
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.5, x: 0.7 } });
    }
  }, []);

  const copyToClipboard = () => {
    if (voucherCode) {
      navigator.clipboard.writeText(voucherCode);
      alert('Voucher code copied!');
    }
  };

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-500 to-green-700">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-500 to-green-700 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="text-7xl mb-4">🏆</div>
        <h1 className="text-3xl font-bold text-green-800 mb-2">Hongera!</h1>
        <p className="text-lg mb-2">Umeshinda vocha!</p>
        <div className="text-5xl font-bold text-green-600 mb-6">TZS {amount}</div>

        {voucherCode && (
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Nambari yako ya vocha</p>
            <div className="flex gap-2">
              <code className="flex-1 bg-white border rounded px-3 py-2 font-mono text-lg font-bold">
                {voucherCode}
              </code>
              <button
                onClick={copyToClipboard}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded transition"
              >
                📋 Nakili
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Wasilisha nambari hii unapolipata ili kupata TZS {amount}
            </p>
          </div>
        )}

        <button
          onClick={() => router.push('/')}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
        >
          Jaribu Bahati Yako Tena!
        </button>
      </div>

      <div className="mt-6 text-white text-sm text-center">
        <p>🎉 Umefanikiwa kushinda! Vocha yako iko tayari kutumika.</p>
        <p>Ina muda wa siku 30. Sheria na masharti yanatumika.</p>
      </div>
    </div>
  );
}