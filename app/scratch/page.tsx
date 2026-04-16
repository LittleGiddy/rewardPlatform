'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import ScratchCard from '../components/ScratchCard';
import dynamic from 'next/dynamic';

const AdsterraAd = dynamic(() => import('../components/AdsterraAds'), { ssr: false });

export default function ScratchPage() {
  const router = useRouter();
  const [amount, setAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noVouchers, setNoVouchers] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<Record<string, any>>({});

  useEffect(() => {
    checkVoucherAvailability();
  }, []);

  const checkVoucherAvailability = async () => {
    setLoading(true);
    setError('');
    setNoVouchers(false);
    
    try {
      const res = await axios.get('/api/scratch');
      setAmount(res.data.amount);
      setLoading(false);
    } catch (err: any) {
      console.error('Scratch error:', err.response?.data);
      
      // Check if it's a "no vouchers" error
      if (err.response?.data?.error === 'NO_VOUCHERS_AVAILABLE') {
        setNoVouchers(true);
        setError(err.response?.data?.message || 'No vouchers available right now');
        
        // Fetch network status to show which networks have vouchers
        try {
          const statusRes = await axios.get('/api/vouchers/status');
          setNetworkStatus(statusRes.data);
        } catch (statusErr) {
          console.error('Failed to fetch network status');
        }
      } else if (err.response?.status === 403) {
        router.push('/retry');
      } else if (err.response?.status === 429) {
        router.push('/retry');
      } else {
        setError('Unable to load scratch card. Please try again later.');
      }
      setLoading(false);
    }
  };

  const handleReveal = () => {
    router.push('/share');
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-600 to-pink-600">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
      <p className="mt-4 text-white">Loading scratch card...</p>
    </div>
  );
  
  // Show "No Vouchers" message with helpful info
  if (noVouchers) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-600 to-pink-600 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Vouchers Available!</h2>
          <p className="text-gray-600 mb-4">
            All vouchers for {error.includes('network') ? error : 'your network'} have been claimed.
          </p>
          
          {/* Show which networks still have vouchers */}
          {networkStatus.availableNetworks && networkStatus.availableNetworks.length > 0 ? (
            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <p className="font-semibold text-green-800 mb-2">✅ Vouchers still available for:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {networkStatus.availableNetworks.map((net: string) => (
                  <span key={net} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    {net}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 rounded-lg p-4 mb-4">
              <p className="text-yellow-800">⚠️ All networks are currently out of vouchers.</p>
              <p className="text-sm text-yellow-600 mt-1">Please check back later!</p>
            </div>
          )}
          
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => router.push('/')}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Go Home
            </button>
            <button
              onClick={checkVoucherAvailability}
              className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition"
            >
              Try Again
            </button>
          </div>
          
          {/* Show ads even when no vouchers */}
          {process.env.NODE_ENV === 'production' && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-400 text-center mb-2">Advertisement</p>
              <AdsterraAd adCode={process.env.NEXT_PUBLIC_ADSTERRA_AD2 || ''} />
            </div>
          )}
        </div>
      </div>
    );
  }
  
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-600 to-pink-600 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => router.push('/')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Go Home
        </button>
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
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            💡 <strong>Cha Kufanya:</strong> Kwangua ili kuangalia vocha. 
            Kisha share kwa marafiki watatu ili kufungua zawadi ya vocha
          </p>
        </div>
      </div>
    </div>
  );
}