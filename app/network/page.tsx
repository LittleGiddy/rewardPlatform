'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

// Network-specific colors and icons
const networkOptions = [
  { 
    name: 'Yas', 
    color: 'from-green-500 to-emerald-600', 
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: '📱',
    gradient: 'group-hover:from-green-600 group-hover:to-emerald-700'
  },
  { 
    name: 'Airtel', 
    color: 'from-red-500 to-red-600', 
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: '📶',
    gradient: 'group-hover:from-red-600 group-hover:to-red-700'
  },
  { 
    name: 'Vodacom', 
    color: 'from-blue-500 to-blue-600', 
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: '📞',
    gradient: 'group-hover:from-blue-600 group-hover:to-blue-700'
  },
  { 
    name: 'Halotel', 
    color: 'from-purple-500 to-purple-600', 
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: '📡',
    gradient: 'group-hover:from-purple-600 group-hover:to-purple-700'
  },
];

export default function NetworkPage() {
  const router = useRouter();
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNetwork) {
      setError('Please select your network');
      return;
    }
    
    setLoading(true);
    setError('');
    console.log('Submitting network:', selectedNetwork);
    try {
      const response = await axios.post('/api/init', { network: selectedNetwork });
      console.log('API response:', response.data);
      console.log('Redirecting to /scan...');
      router.push('/scan');
    } catch (err: any) {
      console.error('API error:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Something went wrong');
      setLoading(false);
    }
  };

  const selectedNetworkData = networkOptions.find(n => n.name === selectedNetwork);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 -left-20 w-72 h-72 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-20 -right-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block bg-white/10 backdrop-blur-sm rounded-full p-3 mb-4">
              <span className="text-4xl">📱</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Chagua Mtandao Wako
            </h1>
            <p className="text-white/80 text-sm">
              Select your network to continue and claim your voucher
            </p>
          </div>

          {/* Form Card */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-shake">
                <span className="text-red-500 text-xl">⚠️</span>
                <div className="flex-1">
                  <p className="text-red-700 font-medium text-sm">{error}</p>
                </div>
                <button 
                  onClick={() => setError('')}
                  className="text-red-400 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Network Selection */}
            <div className="mb-8">
              <label className="block text-gray-700 font-semibold mb-3">
                Select Your Network
              </label>
              
              <div className="grid grid-cols-2 gap-3">
                {networkOptions.map((network) => (
                  <button
                    key={network.name}
                    type="button"
                    onClick={() => setSelectedNetwork(network.name)}
                    className={`
                      relative group p-4 rounded-xl border-2 transition-all duration-300
                      ${selectedNetwork === network.name 
                        ? `${network.bgColor} ${network.borderColor} border-2 shadow-lg transform scale-105` 
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }
                    `}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">{network.icon}</div>
                      <div className={`font-semibold ${selectedNetwork === network.name ? 'text-gray-900' : 'text-gray-700'}`}>
                        {network.name}
                      </div>
                      {selectedNetwork === network.name && (
                        <div className="absolute top-2 right-2 text-green-500">
                          ✓
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Network Preview */}
            {selectedNetwork && (
              <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${selectedNetworkData?.color} flex items-center justify-center text-white text-xl`}>
                    {selectedNetworkData?.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Selected Network</p>
                    <p className="font-bold text-gray-900">{selectedNetwork}</p>
                  </div>
                  <div className="text-green-500 text-sm font-medium">
                    ✓ Ready
                  </div>
                </div>
              </div>
            )}

            {/* Continue Button */}
            <button
              type="submit"
              disabled={loading || !selectedNetwork}
              className={`
                w-full py-3 rounded-xl font-bold text-white transition-all duration-300
                ${selectedNetwork && !loading
                  ? `bg-gradient-to-r ${selectedNetworkData?.color} ${selectedNetworkData?.gradient} shadow-lg hover:shadow-xl transform hover:scale-[1.02]`
                  : 'bg-gray-300 cursor-not-allowed'
                }
              `}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Continue</span>
                  <span>→</span>
                </div>
              )}
            </button>

            {/* Trust Message */}
            <p className="text-center text-xs text-gray-500 mt-6">
              🔒 Your information is secure and will only be used for this promotion
            </p>
          </form>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-white/60 text-xs">
              By continuing, you agree to our Terms and Conditions
            </p>
          </div>
        </div>
      </div>

      {/* Global Styles */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}