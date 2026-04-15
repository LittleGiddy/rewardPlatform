'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import dynamic from 'next/dynamic';

const AdsterraAd = dynamic(() => import('../components/AdsterraAds'), { ssr: false });

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
  const [showPopup, setShowPopup] = useState(true);
  const [hasClosedPopup, setHasClosedPopup] = useState(false);
  const [displayClicks, setDisplayClicks] = useState(0);
  

  useEffect(() => {
    // Get share link and user info
    Promise.all([
      axios.get('/api/share-link'),
      axios.get('/api/debug/user'),
      axios.get('/api/admin/vouchers')
    ]).then(([shareRes, userRes, vouchersRes]) => {
      setLink(shareRes.data.link);
      const actualClicks = shareRes.data.clickCount;
      setClicks(actualClicks);
      setDisplayClicks(actualClicks >= 1 ? 3 : actualClicks);
      
      const amount = userRes.data.currentVoucherAmount;
      setPotentialAmount(amount);
      setStreakInfo({
        consecutiveLosses: userRes.data.consecutiveLosses || 0,
        totalAttempts: userRes.data.totalAttempts || 0
      });
      
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
      const res = await axios.post('/api/verify-share');
      
      if (res.data.verified) {
        const claimRes = await axios.post('/api/claim');
        
        if (claimRes.data.winner) {
          router.push(`/winner?amount=${claimRes.data.amount}&code=${claimRes.data.voucherCode}`);
        } else {
          router.push('/retry');
        }
      } else {
        const needed = 1 - res.data.clicks;
        setError(`Unahitaji ${needed} ${needed === 1 ? 'click' : 'clicks'} zaidi. Sasa: ${res.data.clicks}/1`);
        setClaiming(false);
      }
    } catch (err: any) {
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.error || 'Kuna tatizo. Tafadhali jaribu tena.');
      setClaiming(false);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setHasClosedPopup(true);
    localStorage.setItem('sharePagePopupClosed', 'true');
  };

  // Refresh clicks periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get('/api/share-link');
        const actualClicks = res.data.clickCount;
        setClicks(actualClicks);
        setDisplayClicks(actualClicks >= 1 ? 3 : actualClicks);
      } catch (err) {
        console.error('Failed to refresh clicks:', err);
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const popupClosed = localStorage.getItem('sharePagePopupClosed');
    if (popupClosed === 'true') {
      setShowPopup(false);
      setHasClosedPopup(true);
    }
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-600 to-purple-700">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
    </div>
  );

  const isUnlocked = clicks >= 1;
  const progressPercent = clicks >= 1 ? 100 : (displayClicks / 3) * 100;

  // Create share URLs
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent('🎉 Nimepata zawadi ya TZS ' + potentialAmount + '! Bonyeza kiungo changu upate nafasi yako: ' + link)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;

  return (
    <>
      {/* Popup Modal */}
      {!loading && showPopup && !hasClosedPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 animate-fadeIn p-4">
          <div className="relative max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white text-center">
              <div className="text-4xl mb-2">💡</div>
              <h3 className="text-xl font-bold">Muhimu Kukumbuka!</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-700 mb-4 leading-relaxed">
                Hakikisha unarefresh ukurasa wako baada ya marafiki watatu kufungua kiungo chako.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800 flex items-center justify-center gap-2">
                  <span>🔄</span> Refresh page after 3 friends click your link
                </p>
              </div>
              <button
                onClick={closePopup}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition transform hover:scale-105"
              >
                Naelewa, Endelea →
              </button>
            </div>
            <button
              onClick={closePopup}
              className="absolute top-2 right-3 text-white hover:text-gray-200 transition text-2xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-600 to-purple-700">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          
          {/* TOP BANNER - Desktop */}
          {process.env.NODE_ENV === 'production' && (
            <div className="hidden md:block mb-6 -mt-4">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-400 text-center mb-2">Advertisement</p>
                <AdsterraAd adCode={process.env.NEXT_PUBLIC_ADSTERRA_AD3 || ''} />
              </div>
            </div>
          )}
          
          {/* Potential Prize Section */}
          <div className="text-center mb-6">
            <div className="inline-block bg-yellow-100 rounded-full px-4 py-2 mb-4">
              <span className="font-bold text-yellow-800">🎯 UNA NAFASI YA KUSHINDA</span>
            </div>
            <div className="text-4xl font-bold text-green-600">
              TZS {potentialAmount?.toLocaleString()}
            </div>
            <p className="mt-2 text-gray-600">Unaweza kushinda kiasi hiki!</p>
          </div>

          {/* Small Banner Below Prize */}
          {process.env.NODE_ENV === 'production' && (
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-400 text-center mb-2">Advertisement</p>
                <AdsterraAd adCode={process.env.NEXT_PUBLIC_ADSTERRA_AD1 || ''} />
              </div>
            </div>
          )}

          {/* Low Stock Warning */}
          {poolInfo && poolInfo.remainingVouchers <= 10 && poolInfo.remainingVouchers > 0 && (
            <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded-lg mb-4 text-center">
              <p className="text-sm font-semibold">⚠️ Zawadi chache zimesalia!</p>
              <p className="text-xs">Zimebaki {poolInfo.remainingVouchers} tu kwa kiasi hiki!</p>
            </div>
          )}

          {poolInfo && poolInfo.remainingVouchers === 0 && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-center">
              <p className="text-sm font-semibold">❌ Zawadi zimeisha!</p>
              <p className="text-xs">Hakuna zawadi zilizobaki kwa kiasi hiki. Tafadhali jaribu tena.</p>
            </div>
          )}

          {/* Streak Bonus Display */}
          {streakInfo && streakInfo.consecutiveLosses > 0 && (
            <div className="bg-purple-100 border border-purple-400 text-purple-700 px-4 py-3 rounded-lg mb-4 text-center">
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

          <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
            Shiriki Kufungua Nafasi Yako!
          </h2>
          <p className="text-center text-gray-600 mb-6">
            Shiriki kwa <strong className="text-blue-600">MARAFIKI 3</strong>. 
            Kila rafiki anapaswa kubonyeza link ili kukupa nafasi ya kushinda.
          </p>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          {/* Share Link Section */}
          <div className="flex mb-4">
            <input
              type="text"
              value={link}
              readOnly
              className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 text-sm text-gray-800 bg-white"
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
          
{/* Social Share Buttons with Ad Link */}
<div className="flex gap-2 mb-6">
  <a
    href="https://www.profitablecpmratenetwork.com/k3hsq3eq?key=970b1239d65e56cfd7963d947a2351ba"
    target="_blank"
    rel="noopener noreferrer"
    className="bg-green-500 text-white px-4 py-2 rounded-lg flex-1 text-center hover:bg-green-600 transition"
    onClick={() => {
      // Also open WhatsApp share
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }}
  >
    WhatsApp
  </a>
  <a
    href="https://www.profitablecpmratenetwork.com/k3hsq3eq?key=970b1239d65e56cfd7963d947a2351ba"
    target="_blank"
    rel="noopener noreferrer"
    className="bg-blue-500 text-white px-4 py-2 rounded-lg flex-1 text-center hover:bg-blue-600 transition"
    onClick={() => {
      // Also open Facebook share
      window.open(facebookUrl, '_blank', 'noopener,noreferrer');
    }}
  >
    Facebook
  </a>
</div>
          
          {/* Ad Between Share Buttons and Progress */}
          {process.env.NODE_ENV === 'production' && (
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-400 text-center mb-2">Advertisement</p>
                <AdsterraAd adCode={process.env.NEXT_PUBLIC_ADSTERRA_AD2 || ''} />
              </div>
            </div>
          )}
          
          {/* Progress Section */}
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <p className="font-medium text-gray-700">Vibonyezo vya Kipekee</p>
              <p className="text-lg font-bold text-blue-600">{displayClicks} / 3</p>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-3">
              <div 
                className="bg-green-500 rounded-full h-3 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            {clicks < 1 && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Unahitaji marafiki watatu kufungua (click moja inatosha)
              </p>
            )}
            {clicks >= 1 && (
              <p className="text-xs text-green-600 mt-2 text-center font-semibold">
                ✓ Umefanikiwa! Bonyeza kitufe chini kudai zawadi yako.
              </p>
            )}
          </div>

          {/* Claim Button */}
          <button
            onClick={checkShares}
            disabled={claiming || !isUnlocked || (poolInfo?.remainingVouchers === 0)}
            className={`w-full py-3 rounded-lg font-semibold transition mb-3 ${
              isUnlocked && poolInfo?.remainingVouchers !== 0
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-500 hover:to-orange-600 shadow-lg' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            } disabled:opacity-50`}
          >
            {claiming 
              ? 'Inachakata...' 
              : isUnlocked 
                ? poolInfo?.remainingVouchers === 0 
                  ? '❌ Zawadi Zimeisha - Jaribu Tena' 
                  : '🔓 Fungua Nafasi Yangu!' 
                : '🔒 Subiri Mrafiki 1 Afungue Kiungo'}
          </button>

          {/* Ad Between Claim Button and Footer */}
          {process.env.NODE_ENV === 'production' && (
            <div className="mb-4">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-400 text-center mb-2">Advertisement</p>
                <AdsterraAd adCode={process.env.NEXT_PUBLIC_ADSTERRA_AD3 || ''} />
              </div>
            </div>
          )}

          {/* Footer Note */}
          <p className="text-xs text-gray-500 text-center mt-6">
            Kila mtu ana nafasi ya kushinda vocha. Shiriki kwa marafiki watatu ili kupata nafasi zaidi ya kushinda!
          </p>

          {/* Bottom Banner (Mobile) */}
          {process.env.NODE_ENV === 'production' && (
            <div className="block md:hidden mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-400 text-center mb-2">Advertisement</p>
              <AdsterraAd adCode={process.env.NEXT_PUBLIC_ADSTERRA_AD4 || ''} />
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.4s ease-out; }
      `}</style>
    </>
  );
}