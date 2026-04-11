'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function SharePage() {
  const router = useRouter();
  const [link, setLink] = useState('');
  const [clicks, setClicks] = useState(0);
  const [potentialAmount, setPotentialAmount] = useState<number | null>(null);
  const [streakInfo, setStreakInfo] = useState<any>(null);
  const [poolInfo, setPoolInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get share link and user info
    Promise.all([
      axios.get('/api/share-link'),
      axios.get('/api/debug/user'),
      axios.get('/api/admin/vouchers')
    ]).then(([shareRes, userRes, vouchersRes]) => {
      setLink(shareRes.data.link);
      setClicks(shareRes.data.clickCount);
      const amount = userRes.data.currentVoucherAmount;
      setPotentialAmount(amount);
      setStreakInfo({
        consecutiveLosses: userRes.data.consecutiveLosses || 0,
        totalAttempts: userRes.data.totalAttempts || 0
      });
      
      // Find pool info for this amount
      const pools = vouchersRes.data.pools || [];
      const userPool = pools.find((p: any) => p.amount === amount);
      if (userPool) {
        setPoolInfo(userPool);
      }
      
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
        const needed = 3 - res.data.clicks;
        setError(`Need ${needed} more unique ${needed === 1 ? 'click' : 'clicks'}. Current: ${res.data.clicks}`);
        setClaiming(false);
      }
    } catch (err: any) {
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
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
          <div className="text-4xl font-bold text-green-600">TZS {potentialAmount?.toLocaleString()}</div>
          <p className="text-gray-600 mt-2">Unaweza kushinda kiasi hiki!</p>
        </div>

        {/* Low Stock Warning */}
        {poolInfo && poolInfo.remainingVouchers <= 10 && poolInfo.remainingVouchers > 0 && (
          <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded-lg mb-4 text-center">
            <p className="text-sm font-semibold">⚠️ Limited Stock!</p>
            <p className="text-xs">
              Only {poolInfo.remainingVouchers} voucher{poolInfo.remainingVouchers !== 1 ? 's' : ''} left at this amount!
            </p>
          </div>
        )}

        {poolInfo && poolInfo.remainingVouchers === 0 && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-center">
            <p className="text-sm font-semibold">❌ Out of Stock!</p>
            <p className="text-xs">
              No vouchers left at this amount. Please scratch again for a different amount.
            </p>
          </div>
        )}

        {/* Streak Bonus Display */}
        {streakInfo && streakInfo.consecutiveLosses > 0 && (
          <div className="bg-purple-100 border border-purple-400 text-purple-700 px-4 py-3 rounded-lg mb-4 text-center">
            <p className="text-sm font-semibold">💪 STREAK BONUS ACTIVE!</p>
            <p className="text-xs">
              You've lost {streakInfo.consecutiveLosses} time{streakInfo.consecutiveLosses !== 1 ? 's' : ''} in a row.
              Your chances are increasing!
            </p>
            <p className="text-xs mt-1">
              {streakInfo.consecutiveLosses >= 5 ? '🔥 Maximum bonus reached!' : `+${(streakInfo.consecutiveLosses * 0.1).toFixed(1)}% extra chance!`}
            </p>
          </div>
        )}

        <h2 className="text-2xl font-bold mb-4 text-center">Share kufungua nafasi yako!</h2>
        <p className="text-center text-gray-600 mb-6">
          Share kwa <strong className="text-blue-600">Marafiki watatu</strong>. 
          Kila rafiki anapaswa kufungua link ili kukupa nafasi ya kushinda.
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
            onClick={() => {
              navigator.clipboard.writeText(link);
              alert('Link copied to clipboard!');
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700"
          >
            Copy
          </button>
        </div>
        
        <div className="flex gap-2 mb-6">
          <a
            href={`https://wa.me/?text=${encodeURIComponent('🎉 I just scratched a TZS ' + potentialAmount + ' voucher! Click my link to claim yours too: ' + link)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 text-white px-4 py-2 rounded flex-1 text-center hover:bg-green-600 transition"
          >
            WhatsApp
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-500 text-white px-4 py-2 rounded flex-1 text-center hover:bg-blue-600 transition"
          >
            Facebook
          </a>
        </div>
        
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-gray-700 font-medium">Unique Clicks</p>
            <p className="text-lg font-bold text-blue-600">{clicks} / 3</p>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-3">
            <div 
              className="bg-green-500 rounded-full h-3 transition-all duration-300"
              style={{ width: `${Math.min(100, (clicks / 3) * 100)}%` }}
            ></div>
          </div>
          {clicks < 3 && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Need {3 - clicks} more {3 - clicks === 1 ? 'friend' : 'friends'} to unlock
            </p>
          )}
          {clicks >= 3 && (
            <p className="text-xs text-green-600 mt-2 text-center font-semibold">
              ✓ Ready to claim! Click the button below.
            </p>
          )}
        </div>

        <button
          onClick={checkShares}
          disabled={claiming || clicks < 3 || (poolInfo?.remainingVouchers === 0)}
          className={`w-full py-3 rounded-lg font-semibold transition mb-3 ${
            clicks >= 3 && poolInfo?.remainingVouchers !== 0
              ? 'bg-yellow-500 text-black hover:bg-yellow-600' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          } disabled:opacity-50`}
        >
          {claiming 
            ? 'Processing...' 
            : clicks >= 3 
              ? poolInfo?.remainingVouchers === 0 
                ? '❌ Out of Stock - Scratch Again' 
                : '🔓 Unlock My Chance!' 
              : '🔒 Unahitaji marafiki watatu kufungua'}
        </button>

        <p className="text-xs text-gray-500 text-center mt-6">
          Kila mtu ana nafasi ya kushinda vocha, usisahau kushare kwa marafiki watatu ili uweze kupata nafasi zaidi
        </p>
      </div>
    </div>
  );
}