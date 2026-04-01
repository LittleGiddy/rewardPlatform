'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function SharePage() {
  const router = useRouter();
  const [link, setLink] = useState('');
  const [clicks, setClicks] = useState(0);
  const [potentialAmount, setPotentialAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get share link and user info
    Promise.all([
      axios.get('/api/share-link'),
      axios.get('/api/debug/user')
    ]).then(([shareRes, userRes]) => {
      setLink(shareRes.data.link);
      setClicks(shareRes.data.clickCount);
      setPotentialAmount(userRes.data.currentVoucherAmount);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load data:', err);
      setLoading(false);
      setError('Failed to load share information');
    });
  }, []);

  const checkShares = async () => {
    setClaiming(true);
    setError('');
    try {
      console.log('Checking shares...');
      const res = await axios.post('/api/verify-share');
      console.log('Verify response:', res.data);
      
      if (res.data.verified) {
        console.log('Shares verified, claiming...');
        const claimRes = await axios.post('/api/claim');
        console.log('Claim response:', claimRes.data);
        
        if (claimRes.data.winner) {
          router.push(`/winner?amount=${claimRes.data.amount}&code=${claimRes.data.voucherCode}`);
        } else {
          router.push('/retry');
        }
      } else {
        setError(`Need 3 unique clicks. Current: ${res.data.clicks}`);
        setClaiming(false);
      }
    } catch (err: any) {
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      setClaiming(false);
    }
  };

  const skipForTesting = async () => {
    setClaiming(true);
    setError('');
    console.log('Skipping share verification for testing');
    try {
      const claimRes = await axios.post('/api/claim');
      console.log('Claim response:', claimRes.data);
      
      if (claimRes.data.winner) {
        router.push(`/winner?amount=${claimRes.data.amount}&code=${claimRes.data.voucherCode}`);
      } else {
        router.push('/retry');
      }
    } catch (err: any) {
      console.error('Claim error:', err.response?.data);
      setError(err.response?.data?.error || 'Failed to claim. Please try again.');
      setClaiming(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-600 to-purple-700 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="inline-block bg-yellow-100 rounded-full px-4 py-2 mb-4">
            <span className="text-yellow-800 font-bold">🎯 POTENTIAL PRIZE</span>
          </div>
          <div className="text-4xl font-bold text-green-600">TSH {potentialAmount}</div>
          <p className="text-gray-600 mt-2">You could win this amount!</p>
        </div>

        <h2 className="text-2xl font-bold mb-4 text-center">Share to Unlock Your Chance!</h2>
        <p className="text-center text-gray-600 mb-6">
          Share with <strong className="text-blue-600">3 friends</strong>. 
          Each friend must click your link to increase your chances of winning!
        </p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="flex mb-4">
          <input
            type="text"
            value={link}
            readOnly
            className="flex-1 border rounded-l px-3 py-2 text-sm"
          />
          <button
            onClick={() => navigator.clipboard.writeText(link)}
            className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700"
          >
            Copy
          </button>
        </div>
        
        <div className="flex gap-2 mb-6">
          <a
            href={`https://wa.me/?text=${encodeURIComponent('🎉 I just scratched a KSH ' + potentialAmount + ' voucher! Click my link to claim yours too: ' + link)}`}
            target="_blank"
            className="bg-green-500 text-white px-4 py-2 rounded flex-1 text-center hover:bg-green-600"
          >
            WhatsApp
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`}
            target="_blank"
            className="bg-blue-500 text-white px-4 py-2 rounded flex-1 text-center hover:bg-blue-600"
          >
            Facebook
          </a>
        </div>
        
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <p className="text-center text-gray-700">
            📊 <strong>{clicks}</strong> / 3 unique clicks
          </p>
          <div className="w-full bg-gray-300 rounded-full h-2 mt-2">
            <div 
              className="bg-green-500 rounded-full h-2 transition-all duration-300"
              style={{ width: `${Math.min(100, (clicks / 3) * 100)}%` }}
            ></div>
          </div>
        </div>

        <button
          onClick={checkShares}
          disabled={claiming}
          className="w-full bg-yellow-500 text-black py-3 rounded-lg font-semibold hover:bg-yellow-600 transition disabled:opacity-50 mb-3"
        >
          {claiming ? 'Processing...' : '🔓 I\'ve shared! Unlock My Chance'}
        </button>
        
        {/* Development skip button */}
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={skipForTesting}
            disabled={claiming}
            className="w-full bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition"
          >
            🧪 Skip Sharing (Dev Only)
          </button>
        )}

        <p className="text-xs text-gray-500 text-center mt-6">
          * Winning is not guaranteed. Only 1 in 10 users win their potential prize.
          Share with more friends to increase your chances!
        </p>
      </div>
    </div>
  );
}