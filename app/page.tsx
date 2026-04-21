'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import CountdownTimer to reduce initial bundle size
const CountdownTimer = dynamic(() => import('./components/CountdownTimer'), {
  ssr: false,
  loading: () => <span className="text-3xl font-mono">--:--:--</span>
});

// Dynamically import Adsterra Hero component
const AdsterraHero = dynamic(() => import('./components/AdsterraHero'), { ssr: false });

export default function Home() {
  const router = useRouter();
  const [counter, setCounter] = useState(1247);
  const [targetTime, setTargetTime] = useState<number | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [floatingMessages, setFloatingMessages] = useState<any[]>([]);
  const [recentWinners, setRecentWinners] = useState([
    { name: "James M.", amount: "1,500", network: "Vodacom", time: "just now", country: "TZ" },
    { name: "Sarah K.", amount: "500", network: "Airtel", time: "2 min ago", country: "TZ" },
    { name: "John D.", amount: "2,000", network: "MTN", time: "5 min ago", country: "UG" },
  ]);
  
  const ctaRef = useRef<HTMLButtonElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  // Simplified comments for faster loading
  const comments = [
    { name: "Ali H.", message: "Nimepata Tigo ya 5,000!", avatar: "AH", country: "TZ" },
    { name: "Fatma S.", message: "Kweli ni serious!", avatar: "FS", country: "TZ" },
    { name: "John M.", message: "Nimeshare nikapata 2,000", avatar: "JM", country: "UG" },
    { name: "Aisha K.", message: "Nimepata Halotel!", avatar: "AK", country: "TZ" },
    { name: "Robert T.", message: "Kweli aisee!", avatar: "RT", country: "TZ" },
  ];

  // Auto-scroll to CTA button after overlay closes
  useEffect(() => {
    if (!showOverlay && ctaRef.current) {
      setTimeout(() => {
        ctaRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [showOverlay]);

  useEffect(() => {
    setTargetTime(Date.now() + 24 * 60 * 60 * 1000);
  }, []);

  // Simplified counter update (less frequent)
  useEffect(() => {
    const interval = setInterval(() => {
      setCounter(prev => prev + Math.floor(Math.random() * 2));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Simplified floating messages (fewer, faster)
  useEffect(() => {
    const addFloatingMessage = () => {
      const randomComment = comments[Math.floor(Math.random() * comments.length)];
      const newMessage = {
        id: Date.now(),
        ...randomComment,
        position: Math.random() * 70 + 15,
      };
      setFloatingMessages(prev => [...prev, newMessage]);
      
      setTimeout(() => {
        setFloatingMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
      }, 7000);
    };

    // Start after overlay closes
    if (!showOverlay) {
      const interval = setInterval(addFloatingMessage, 5000);
      return () => clearInterval(interval);
    }
  }, [showOverlay]);

  // Auto-hide overlay faster (2 seconds)
  useEffect(() => {
    if (showOverlay) {
      const timer = setTimeout(() => {
        setShowOverlay(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showOverlay]);

  // Simplified winners update
  useEffect(() => {
    if (!showOverlay) {
      const winnerNames = ["David K.", "Lucy M.", "Brian O.", "Cynthia W.", "Emmanuel T."];
      const networks = ["Vodacom", "Airtel", "MTN", "Halotel", "Yas"];
      const amounts = ["500", "1,000", "1,500", "2,000"];
      
      const addRecentWinner = () => {
        const newWinner = {
          name: winnerNames[Math.floor(Math.random() * winnerNames.length)],
          amount: amounts[Math.floor(Math.random() * amounts.length)],
          network: networks[Math.floor(Math.random() * networks.length)],
          time: "just now",
          country: "TZ"
        };
        setRecentWinners(prev => [newWinner, ...prev.slice(0, 2)]);
      };

      const interval = setInterval(addRecentWinner, 20000);
      return () => clearInterval(interval);
    }
  }, [showOverlay]);

  return (
    <>
      {/* Simplified Overlay Modal - Faster animation */}
      {showOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95 animate-fadeIn">
          <div className="relative max-w-sm mx-4 animate-slideUp">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-1 shadow-2xl">
              <div className="rounded-xl p-6 text-center bg-white">
                <div className="text-6xl mb-3 animate-bounce">🎁</div>
                <h2 className="text-2xl font-bold mb-2 text-gray-800">
                  Special Offer!
                </h2>
                <p className="text-sm mb-3 text-gray-600">
                  Umechaguliwa na Little Giddy kushinda vocha
                </p>
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-3 mb-3">
                  <p className="text-white font-bold text-sm">🔥 Limited Time!</p>
                </div>
                <button
                  onClick={() => setShowOverlay(false)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full font-semibold text-sm hover:scale-105 transition"
                >
                  Claim Now →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="min-h-screen relative flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        
        {/* Simplified Background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 -right-20 w-60 h-60 bg-yellow-400 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-400 rounded-full blur-3xl"></div>
        </div>

        {/* Floating Messages */}
        {!showOverlay && floatingMessages.map((msg) => (
          <div
            key={msg.id}
            className="fixed z-30 pointer-events-none"
            style={{
              bottom: '-80px',
              left: `${msg.position}%`,
              animation: 'floatUp 7s ease-out forwards'
            }}
          >
            <div className="rounded-xl shadow-lg p-2 max-w-[200px] bg-white">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs">
                  {msg.avatar}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-xs text-gray-800">
                    {msg.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {msg.message}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Live Social Proof Ticker */}
        <div className="fixed top-0 left-0 right-0 backdrop-blur-md z-20 py-1 border-b bg-white/80 border-gray-200">
          <div className="overflow-hidden whitespace-nowrap">
            <div className="inline-block animate-scroll">
              {[...recentWinners, ...recentWinners].map((winner, idx) => (
                <span key={idx} className="mx-3 text-xs text-gray-600">
                  🎉 {winner.name} won TZS {winner.amount} on {winner.network}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area - Flex grow to push footer down */}
        <div className="relative z-10 flex-grow flex flex-col items-center justify-center px-4 pt-20 pb-8">
          
          {/* Logo at the top */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="Vuna Vocha Logo" 
                className="h-32 md:h-40 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>

          {/* Hero Badge */}
          <div className="mb-4">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-1 rounded-full text-xs font-semibold shadow-lg">
              🔥 LIMITED TIME OFFER
            </div>
          </div>

          {/* Main Title */}
          <div className="text-center mb-3">
            <h1 className="text-4xl md:text-6xl font-bold mb-2 text-gray-800">
              Umechaguliwa!
            </h1>
            <div className="h-0.5 w-16 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto rounded-full"></div>
          </div>
          
          <p className="text-base md:text-lg text-center mb-8 text-gray-600">
            Una nafasi kubwa ya kushinda vocha
          </p>

          {/* Timer Card */}
          <div className="rounded-xl p-4 mb-6 shadow-lg border w-full max-w-xs bg-white/50 border-gray-200 backdrop-blur-sm">
            <p className="text-center text-xs mb-1 text-gray-600">
              ⏰ Offer ends in:
            </p>
            <div className="text-2xl md:text-3xl font-mono font-bold text-yellow-500 text-center">
              {targetTime ? <CountdownTimer targetDate={targetTime} /> : 'Loading...'}
            </div>
          </div>

          {/* Stats - 2 columns */}
          <div className="grid grid-cols-2 gap-3 mb-8 max-w-md w-full">
            <div className="rounded-lg p-3 text-center border bg-white/50 border-gray-200 backdrop-blur-sm">
              <div className="text-2xl mb-1">👥</div>
              <div className="text-xl font-bold text-gray-800">
                {counter.toLocaleString()}+
              </div>
              <p className="text-xs text-gray-500">
                Wamejishindia leo
              </p>
            </div>
            
            <div className="rounded-lg p-3 text-center border bg-white/50 border-gray-200 backdrop-blur-sm">
              <div className="text-2xl mb-1">⭐</div>
              <div className="text-xl font-bold text-gray-800">
                4.8
              </div>
              <p className="text-xs text-gray-500">
                User Rating
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <button
            ref={ctaRef}
            onClick={() => router.push('/network')}
            className="group relative bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white px-6 md:px-8 py-3 rounded-full text-base md:text-lg font-bold hover:scale-105 transition-all duration-300 shadow-xl mb-8"
          >
            <span className="relative z-10 flex items-center gap-2">
              🎁 Chagua Mtandao wako
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </button>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-4 text-xs mb-8">
            <div className="flex items-center gap-1 text-gray-500">
              <span className="text-green-500">✓</span>
              <span>100% Free</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <span className="text-green-500">✓</span>
              <span>Instant Payout</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <span className="text-green-500">✓</span>
              <span>24/7 Support</span>
            </div>
          </div>

          {/* ADSTERRA HERO AD */}
          {process.env.NODE_ENV === 'production' && (
            <div className="w-full max-w-md mx-auto mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                <p className="text-xs text-gray-400 text-center mb-2">Advertisement</p>
                <AdsterraHero />
              </div>
            </div>
          )}
        </div>

        {/* Footer - All rights reserved at the bottom */}
        <footer ref={footerRef} className="relative z-10 text-center py-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Vuna Vocha. All rights reserved. Developed by LITTLE GIDDY
          </p>
        </footer>
      </div>

      {/* Simplified Global Styles */}
      <style jsx global>{`
        @keyframes floatUp {
          0% { bottom: -80px; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { bottom: 100vh; opacity: 0; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        
        .animate-floatUp { animation: floatUp 7s ease-out forwards; }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .animate-scroll { animation: scroll 15s linear infinite; }
        .animate-bounce { animation: bounce 0.5s ease-out; }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </>
  );
}