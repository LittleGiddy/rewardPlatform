'use client';
import { useState } from 'react';
import axios from 'axios';

export default function TestAdmin() {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return <div className="min-h-screen flex items-center justify-center">Access Denied</div>;
  }

  const simulateClicks = async () => {
    if (!userId) {
      setMessage('Please enter User ID');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/test/simulate-clicks', { userId, count: 3 });
      setMessage(`✅ ${res.data.message} - Total clicks: ${res.data.totalClicks}`);
    } catch (err: any) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  const forceWin = async () => {
    if (!userId) {
      setMessage('Please enter User ID');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/test/force-win', { userId });
      setMessage(`✅ ${res.data.message} - Won ${res.data.amount} KSH`);
    } catch (err: any) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  const forceLoss = async () => {
    if (!userId) {
      setMessage('Please enter User ID');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/test/force-loss', { userId });
      setMessage(`✅ ${res.data.message}`);
    } catch (err: any) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  const resetAttempts = async () => {
    if (!userId) {
      setMessage('Please enter User ID');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/test/reset-attempts', { userId });
      setMessage(`✅ ${res.data.message}`);
    } catch (err: any) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  const getUserInfo = async () => {
    if (!userId) {
      setMessage('Please enter User ID');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`/api/test/user-info?userId=${userId}`);
      setMessage(`
        📊 User Info:
        - Network: ${res.data.network}
        - Attempts Today: ${res.data.attemptsToday}/5
        - Last Attempt: ${res.data.lastAttemptAt || 'Never'}
        - Locked Until: ${res.data.lockUntil || 'Not locked'}
        - Current Voucher: ${res.data.hasVoucher ? 'Yes' : 'No'}
        - Shares Verified: ${res.data.sharesVerified ? 'Yes' : 'No'}
        - Total Clicks: ${res.data.totalClicks}
      `);
    } catch (err: any) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🧪 Test Admin Panel</h1>
        <p className="text-gray-600 mb-6">Use this panel to simulate different scenarios for testing</p>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block mb-2 font-semibold">User ID (from cookies or database)</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Paste user ID here"
            className="w-full border rounded px-3 py-2 mb-4"
          />
          <p className="text-sm text-gray-500 mb-4">
            💡 Tip: Check browser cookies or run <code className="bg-gray-100 px-2 py-1 rounded">db.users.find()</code> in MongoDB
          </p>

          {message && (
            <pre className="bg-gray-100 p-3 rounded mb-4 whitespace-pre-wrap text-sm">
              {message}
            </pre>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={simulateClicks}
              disabled={loading}
              className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              🖱️ Simulate 3 Clicks
            </button>
            <button
              onClick={forceWin}
              disabled={loading}
              className="bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              🏆 Force Win
            </button>
            <button
              onClick={forceLoss}
              disabled={loading}
              className="bg-orange-600 text-white py-2 rounded hover:bg-orange-700 disabled:opacity-50"
            >
              😢 Force Loss
            </button>
            <button
              onClick={resetAttempts}
              disabled={loading}
              className="bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            >
              🔄 Reset Daily Attempts
            </button>
            <button
              onClick={getUserInfo}
              disabled={loading}
              className="bg-gray-600 text-white py-2 rounded hover:bg-gray-700 disabled:opacity-50 col-span-2"
            >
              ℹ️ Get User Info
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="font-bold mb-2">📋 How to get User ID:</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Open browser DevTools (F12)</li>
            <li>Go to Application → Cookies → http://localhost:3000</li>
            <li>Look for the token cookie, or</li>
            <li>Run in MongoDB: <code>db.users.find().pretty()</code> and copy the _id</li>
            <li>Paste it in the input above</li>
          </ol>
        </div>
      </div>
    </div>
  );
}