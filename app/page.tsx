'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// import dynamic from 'next/dynamic';
import CountdownTimer from './components/CountdownTimer'; // direct import

export default function Home() {
  const router = useRouter();
  const [counter, setCounter] = useState(1247);
  const [targetTime, setTargetTime] = useState<number | null>(null);

  useEffect(() => {
    // Set target time only on client
    setTargetTime(Date.now() + 24 * 60 * 60 * 1000);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter(prev => prev + Math.floor(Math.random() * 3));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-600 to-purple-700 text-white">
      <h1 className="text-4xl font-bold mb-4">You have been selected!</h1>
      <p className="text-xl mb-8">You have a very big chance to win a voucher.</p>
      <div className="text-2xl mb-4">
        {targetTime ? <CountdownTimer targetDate={targetTime} /> : 'Loading...'}
      </div>
      <p className="text-lg mb-8">{counter} people claimed today</p>
      <button
        onClick={() => router.push('/network')}
        className="bg-yellow-400 text-black px-8 py-3 rounded-full text-xl font-semibold hover:bg-yellow-300 transition"
      >
        Enter Your Network to Continue
      </button>
    </div>
  );
}