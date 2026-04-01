'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import ScratchCard from '../components/ScratchCard';

export default function ScratchPage() {
  const router = useRouter();
  const [amount, setAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/scratch')
      .then(res => {
        setAmount(res.data.amount);
        setLoading(false);
      })
      .catch(err => {
        if (err.response?.status === 403) {
          // Locked or limit reached
          router.push('/retry');
        } else if (err.response?.status === 429) {
          // Cooldown
          router.push('/retry');
        } else {
          setError('Error loading scratch card');
          setLoading(false);
        }
      });
  }, [router]);

  const handleReveal = () => {
    // After scratch, proceed to share page
    router.push('/share');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h2 className="text-2xl font-bold mb-6">Scratch to reveal your prize</h2>
      <ScratchCard amount={amount!} onReveal={handleReveal} />
    </div>
  );
}