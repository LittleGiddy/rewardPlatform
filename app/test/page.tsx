'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function TestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [message, setMessage] = useState('');

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return <div className="min-h-screen flex items-center justify-center">Access Denied</div>;
  }

  const loginAsTestUser = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/test/login', {});
      setMessage(`✅ Logged in as test user: ${res.data.userId}`);
      setUserInfo(res.data);
      // Refresh page to apply cookie
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (err: any) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loginAsSpecificUser = async () => {
    const userId = prompt('Enter User ID:');
    if (!userId) return;
    
    setLoading(true);
    try {
      const res = await axios.post('/api/test/login', { userId });
      setMessage(`✅ Logged in as user: ${userId}`);
      setUserInfo(res.data);
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (err: any) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const simulateClicks = async () => {
    const userId = userInfo?.userId || prompt('Enter User ID:');
    if (!userId) return;
    
    setLoading(true);
    try {
      const res = await axios.post('/api/test/simulate-clicks', { userId, count: 3 });
      setMessage(`✅ ${res.data.message}`);
    } catch (err: any) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const forceWin = async () => {
    const userId = userInfo?.userId || prompt('Enter User ID:');
    if (!userId) return;
    
    setLoading(true);
    try {
      const res = await axios.post('/api/test/force-win', { userId });
      setMessage(`✅ ${res.data.message} - Won ${res.data.amount} KSH`);
    } catch (err: any) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetUser = async () => {
    const userId = userInfo?.userId || prompt('Enter User ID:');
    if (!userId) return;
    
    setLoading(true);
    try {
      await axios.post('/api/test/reset-user', { userId });
      setMessage(`✅ User reset successfully`);
    } catch (err: any) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      const res = await axios.get('/api/debug/user');
      setUserInfo(res.data);
      setMessage(`✅ User status loaded`);
    } catch (err: any) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
  };

  const clearCookies = () => {
    document.cookie.split(";").forEach(function(c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    setMessage('✅ Cookies cleared. Refresh the page.');
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">🧪 Test Dashboard</h1>
        <p className="text-gray-600 mb-6">Use JWT tokens to test all scenarios</p>

        {message && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
            {message}
          </div>
        )}

        {userInfo && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="font-bold mb-2">Current User</h2>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(userInfo, null, 2)}
            </pre>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={loginAsTestUser}
            disabled={loading}
            className="bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            🚀 Login as Test User
          </button>
          <button
            onClick={loginAsSpecificUser}
            disabled={loading}
            className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            👤 Login as Specific User
          </button>
          <button
            onClick={clearCookies}
            disabled={loading}
            className="bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50"
          >
            🍪 Clear Cookies
          </button>
          <button
            onClick={checkStatus}
            disabled={loading}
            className="bg-gray-600 text-white py-2 rounded hover:bg-gray-700 disabled:opacity-50"
          >
            🔄 Refresh Status
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-bold mb-4">🛠️ Test Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={simulateClicks}
              disabled={loading}
              className="bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            >
              🖱️ Simulate 3 Clicks
            </button>
            <button
              onClick={forceWin}
              disabled={loading}
              className="bg-yellow-600 text-white py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
            >
              🏆 Force Win
            </button>
            <button
              onClick={resetUser}
              disabled={loading}
              className="bg-orange-600 text-white py-2 rounded hover:bg-orange-700 disabled:opacity-50 col-span-2"
            >
              🔄 Reset User (Clear attempts/voucher)
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="font-bold mb-2">📋 How to Test:</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Click "Login as Test User" to get a JWT token</li>
            <li>Go to home page and select a network</li>
            <li>Scratch the card</li>
            <li>Return to this dashboard and click "Simulate 3 Clicks"</li>
            <li>Go to share page and click "Check & Claim"</li>
            <li>Use "Force Win" to guarantee winning</li>
            <li>Use "Reset User" to clear attempts and try again</li>
          </ol>
        </div>
      </div>
    </div>
  );
}