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
      <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-100 p-4">
  <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
    <h2 className="text-2xl font-bold mb-2 text-gray-800">Tafadhali, Jaribu tena baada ya</h2>
    <div className="text-4xl font-mono font-bold text-yellow-600 my-4">
      <CountdownTimer 
        targetDate={new Date().getTime() + status.remaining} 
        onComplete={() => router.push('/scratch')} 
      />
    </div>
    <p className="text-sm text-gray-600 mt-4">
      ⚠️ Ukifunga hapa itakulazimu kuanza upya na kushare link upya.
    </p>
  </div>
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