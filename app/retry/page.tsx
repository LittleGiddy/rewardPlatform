'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import CountdownTimer from '../components/CountdownTimer';

export default function RetryPage() {
  const router = useRouter();
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    axios.get('/api/retry-status').then(res => setStatus(res.data));
  }, []);

  if (!status) return <div>Loading...</div>;

  if (status.locked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-100">
        <h2 className="text-2xl font-bold mb-4">Daily limit reached</h2>
        <p className="mb-4">Come back in 48 hours.</p>
        <CountdownTimer targetDate={new Date(status.lockUntil).getTime()} />
      </div>
    );
  }

  if (status.cooldown) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-100">
        <h2 className="text-2xl font-bold mb-4 text-black dark:text-black">Bad luck! Try again in</h2>
        <CountdownTimer targetDate={new Date().getTime() + status.remaining} onComplete={() => router.push('/scratch')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <p className="text-xl mb-4">You can try again now!</p>
      <button
        onClick={() => router.push('/scratch')}
        className="bg-blue-600 text-white px-6 py-3 rounded"
      >
        Scratch Again
      </button>
    </div>
  );
}