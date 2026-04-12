'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import dynamic from 'next/dynamic';
import ScratchCard from '../components/ScratchCard';

// Dynamically import Ad component to avoid SSR issues
const AdsterraAd = dynamic(() => import('../components/AdsterraAds'), { ssr: false });

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
          router.push('/retry');
        } else if (err.response?.status === 429) {
          router.push('/retry');
        } else {
          setError('Error loading scratch card');
          setLoading(false);
        }
      });
  }, [router]);

  const handleReveal = () => {
    // After scratching, proceed to share page
    router.push('/share');
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      <p className="mt-4 text-gray-600">Preparing your scratch card...</p>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded">
        {error}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-600 to-pink-600 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">🎁 Kwangua kufungua</h2>
        <p className="text-gray-600 mb-6">Kwangua hapa chini kufungua zawadi yako</p>
        
        <div className="flex justify-center mb-6">
          <ScratchCard amount={amount!} onReveal={handleReveal} />
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            💡 <strong>Cha Kufanya:</strong> Kwangua ili kuangalia vocha. 
            Kisha share kwa marafiki watatu ili kufungua zawadi ya vocha
          </p>
        </div>

        {/* ADSTERRA AD - Code 2 */}
        {process.env.NODE_ENV === 'production' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-400 text-center mb-2">Advertisement</p>
            <AdsterraAd adCode={process.env.NEXT_PUBLIC_ADSTERRA_AD2 || ''} />
          </div>
        )}
      </div>
    </div>
  );
}