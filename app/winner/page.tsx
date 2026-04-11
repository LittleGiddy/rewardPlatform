'use client';
import { useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

export default function WinnerPage() {
  const searchParams = useSearchParams();
  const amount = searchParams.get('amount');

  useEffect(() => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-100">
      <h1 className="text-4xl font-bold text-green-800 mb-4">Congratulations!</h1>
      <p className="text-2xl mb-8">You won TSH {amount} voucher!</p>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <p className="text-xl">Voucher Code: <span className="font-mono">WIN{Math.random().toString(36).substring(2,10).toUpperCase()}</span></p>
      </div>
    </div>
  );
}