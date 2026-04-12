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
  const [darkMode, setDarkMode] = useState(false);

  // Check for dark mode
  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDark);
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

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
        setError(`Unahitaji ${needed} ${needed === 1 ? 'click' : 'clicks'} zaidi. Sasa: ${res.data.clicks}`);
        setClaiming(false);
      }
    } catch (err: any) {
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.error || 'Kuna tatizo. Tafadhali jaribu tena.');
      setClaiming(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-600 to-purple-700">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-300 ${
      darkMode ? 'bg-gradient-to-b from-gray-900 to-gray-800' : 'bg-gradient-to-b from-blue-600 to-purple-700'
    }`}>
      <div className={`rounded-2xl shadow-2xl p-8 max-w-md w-full transition-colors duration-300 ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        
        {/* Potential Prize Section */}
        <div className="text-center mb-6">
          <div className={`inline-block rounded-full px-4 py-2 mb-4 ${
            darkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
          }`}>
            <span className="font-bold">🎯 ZAWADI YANAYOWEZANA</span>
          </div>
          <div className={`text-4xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
            TZS {potentialAmount?.toLocaleString()}
          </div>
          <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Unaweza kushinda kiasi hiki!
          </p>
        </div>

        {/* Low Stock Warning */}
        {poolInfo && poolInfo.remainingVouchers <= 10 && poolInfo.remainingVouchers > 0 && (
          <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded-lg mb-4 text-center dark:bg-orange-900/30 dark:border-orange-600 dark:text-orange-300">
            <p className="text-sm font-semibold">⚠️ Zawadi chache zimesalia!</p>
            <p className="text-xs">
              Zimebaki {poolInfo.remainingVouchers} tu kwa kiasi hiki!
            </p>
          </div>
        )}

        {poolInfo && poolInfo.remainingVouchers === 0 && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-center dark:bg-red-900/30 dark:border-red-600 dark:text-red-300">
            <p className="text-sm font-semibold">❌ Zawadi zimeisha!</p>
            <p className="text-xs">
              Hakuna zawadi zilizobaki kwa kiasi hiki. Tafadhali jaribu tena kwa kiasi kingine.
            </p>
          </div>
        )}

        {/* Streak Bonus Display */}
        {streakInfo && streakInfo.consecutiveLosses > 0 && (
          <div className="bg-purple-100 border border-purple-400 text-purple-700 px-4 py-3 rounded-lg mb-4 text-center dark:bg-purple-900/30 dark:border-purple-600 dark:text-purple-300">
            <p className="text-sm font-semibold">💪 BONASI YA MSURUDO IMEANZISHA!</p>
            <p className="text-xs">
              Umepoteza mara {streakInfo.consecutiveLosses} mfululizo.
              Nafasi yako ya kushinda inaongezeka!
            </p>
            <p className="text-xs mt-1">
              {streakInfo.consecutiveLosses >= 5 ? '🔥 Umezidi kiwango cha juu!' : `+${(streakInfo.consecutiveLosses * 0.1).toFixed(1)}% nafasi zaidi!`}
            </p>
          </div>
        )}

        <h2 className={`text-2xl font-bold mb-4 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Shiriki Kufungua Nafasi Yako!
        </h2>
        <p className={`text-center mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Shiriki kwa <strong className={darkMode ? 'text-blue-400' : 'text-blue-600'}>MARAFIKI 3</strong>. 
          Kila rafiki anapaswa kubonyeza kiungo chako ili kukupa nafasi ya kushinda.
        </p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 dark:bg-red-900/30 dark:border-red-600 dark:text-red-300">
            {error}
          </div>
        )}
        
        {/* Share Link Section */}
        <div className="flex mb-4">
          <input
            type="text"
            value={link}
            readOnly
            className={`flex-1 border rounded-l-lg px-3 py-2 text-sm ${
              darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
            }`}
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(link);
              alert('Kiungo kimenakiliwa!');
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 transition"
          >
            Nakili
          </button>
        </div>
        
        {/* Social Share Buttons */}
        <div className="flex gap-2 mb-6">
          <a
            href={`https://wa.me/?text=${encodeURIComponent('🎉 Nimepata zawadi ya TZS ' + potentialAmount + '! Bonyeza kiungo changu upate nafasi yako: ' + link)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 text-white px-4 py-2 rounded-lg flex-1 text-center hover:bg-green-600 transition"
          >
            WhatsApp
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg flex-1 text-center hover:bg-blue-600 transition"
          >
            Facebook
          </a>
        </div>
        
        {/* Progress Section */}
        <div className={`rounded-lg p-4 mb-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex justify-between items-center mb-2">
            <p className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Vibonyezo vya Kipekee
            </p>
            <p className={`text-lg font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              {clicks} / 3
            </p>
          </div>
          <div className={`w-full rounded-full h-3 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}>
            <div 
              className="bg-green-500 rounded-full h-3 transition-all duration-300"
              style={{ width: `${Math.min(100, (clicks / 3) * 100)}%` }}
            ></div>
          </div>
          {clicks < 3 && (
            <p className={`text-xs mt-2 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Unahitaji {3 - clicks} zaidi kufungua
            </p>
          )}
          {clicks >= 3 && (
            <p className="text-xs text-green-600 mt-2 text-center font-semibold dark:text-green-400">
              ✓ Tayari kudai! Bonyeza kitufe chini.
            </p>
          )}
        </div>

        {/* Claim Button */}
        <button
          onClick={checkShares}
          disabled={claiming || clicks < 3 || (poolInfo?.remainingVouchers === 0)}
          className={`w-full py-3 rounded-lg font-semibold transition mb-3 ${
            clicks >= 3 && poolInfo?.remainingVouchers !== 0
              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-500 hover:to-orange-600 shadow-lg' 
              : `${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-300 text-gray-500'} cursor-not-allowed`
          } disabled:opacity-50`}
        >
          {claiming 
            ? 'Inachakata...' 
            : clicks >= 3 
              ? poolInfo?.remainingVouchers === 0 
                ? '❌ Zawadi Zimeisha - Jaribu Tena' 
                : '🔓 Fungua Nafasi Yangu!' 
              : '🔒 Unahitaji Marafiki Watatu Kufungua'}
        </button>

        {/* Footer Note */}
        <p className={`text-xs text-center mt-6 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          Kila mtu ana nafasi ya kushinda vocha. Shiriki kwa marafiki watatu ili kupata nafasi zaidi ya kushinda!
        </p>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`mt-4 w-full py-2 rounded-lg text-sm transition ${
            darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {darkMode ? '☀️ Mwangaza' : '🌙 Giza'}
        </button>
      </div>
    </div>
  );
}