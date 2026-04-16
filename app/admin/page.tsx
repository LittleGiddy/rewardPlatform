'use client';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearType, setClearType] = useState<'activities' | 'scratchEvents' | 'all' | 'old'>('activities');
  const [clearDays, setClearDays] = useState(7);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, activitiesRes] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/activities')
      ]);
      setStats(statsRes.data);
      setRecentActivities(activitiesRes.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Clear activities
  const clearActivities = async () => {
    try {
      const res = await axios.delete('/api/admin/activities/clear');
      setMessage(`✅ ${res.data.message}`);
      await fetchDashboardData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Failed to clear activities');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Clear scratch events
  const clearScratchEvents = async () => {
    try {
      const res = await axios.delete('/api/admin/scratch-events/clear');
      setMessage(`✅ ${res.data.message}`);
      await fetchDashboardData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Failed to clear scratch events');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Clear old activities
  const clearOldActivities = async (days: number) => {
    try {
      const res = await axios.delete(`/api/admin/activities/clear?olderThanDays=${days}`);
      setMessage(`✅ ${res.data.message}`);
      await fetchDashboardData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Failed to clear old activities');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Clear all data (scratch events + activities)
  const clearAllData = async () => {
    try {
      await axios.delete('/api/admin/scratch-events/clear');
      await axios.delete('/api/admin/activities/clear');
      setMessage(`✅ All activities and scratch events cleared successfully`);
      await fetchDashboardData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Failed to clear data');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleClearConfirm = () => {
    setShowClearModal(false);
    if (clearType === 'activities') {
      clearActivities();
    } else if (clearType === 'scratchEvents') {
      clearScratchEvents();
    } else if (clearType === 'old') {
      clearOldActivities(clearDays);
    } else if (clearType === 'all') {
      clearAllData();
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading dashboard...</div>;
  }

  const statCards = [
    { title: 'Total Users', value: stats?.totalUsers || 0, icon: '👥', color: 'from-blue-500 to-blue-600' },
    { title: 'Total Scratches', value: stats?.totalScratches || 0, icon: '🎰', color: 'from-purple-500 to-purple-600' },
    { title: 'Total Winners', value: stats?.totalWinners || 0, icon: '🏆', color: 'from-yellow-500 to-yellow-600' },
    { title: 'Vouchers Remaining', value: stats?.remainingVouchers || 0, icon: '🎫', color: 'from-green-500 to-green-600' },
    { title: 'Win Rate', value: `${stats?.winRate || 0}%`, icon: '📊', color: 'from-red-500 to-red-600' },
    { title: 'Active Users Today', value: stats?.activeUsersToday || 0, icon: '🔥', color: 'from-orange-500 to-orange-600' },
  ];

  return (
    <div>
      {/* Message Alert */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl animate-fadeIn ${
          message.includes('✅') 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's what's happening with your platform.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setClearType('old');
              setShowClearModal(true);
            }}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition flex items-center gap-2"
          >
            <span>🗑️</span>
            <span>Clear Old Activities</span>
          </button>
          <button
            onClick={() => {
              setClearType('all');
              setShowClearModal(true);
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2"
          >
            <span>⚠️</span>
            <span>Clear All Data</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((card, idx) => (
          <div key={idx} className={`bg-gradient-to-r ${card.color} rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">{card.title}</p>
                <p className="text-3xl font-bold mt-1">{card.value.toLocaleString()}</p>
              </div>
              <div className="text-4xl">{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Clear Options Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Clear Activities</h3>
            <span className="text-2xl">📋</span>
          </div>
          <p className="text-gray-500 text-sm mb-4">Remove all activity logs from the dashboard</p>
          <button
            onClick={() => {
              setClearType('activities');
              setShowClearModal(true);
            }}
            className="w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition"
          >
            Clear Activities
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Clear Scratch Events</h3>
            <span className="text-2xl">🎰</span>
          </div>
          <p className="text-gray-500 text-sm mb-4">Remove all scratch event records from the database</p>
          <button
            onClick={() => {
              setClearType('scratchEvents');
              setShowClearModal(true);
            }}
            className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition"
          >
            Clear Scratch Events
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Clear Old Data</h3>
            <span className="text-2xl">📅</span>
          </div>
          <p className="text-gray-500 text-sm mb-4">Remove activities older than selected days</p>
          <div className="flex gap-2">
            <select
              value={clearDays}
              onChange={(e) => setClearDays(parseInt(e.target.value))}
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            >
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
            </select>
            <button
              onClick={() => {
                setClearType('old');
                setShowClearModal(true);
              }}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Recent Activities</h2>
          <button
            onClick={() => {
              setClearType('activities');
              setShowClearModal(true);
            }}
            className="text-sm text-red-600 hover:text-red-800 transition"
          >
            Clear All
          </button>
        </div>
        <div className="space-y-3">
          {recentActivities.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent activities</p>
          ) : (
            recentActivities.map((activity, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl">{activity.icon}</div>
                <div className="flex-1">
                  <p className="text-gray-800">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
                {activity.status && (
                  <span className={`px-2 py-1 rounded text-xs ${
                    activity.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {activity.status}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Confirm Clear</h3>
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                {clearType === 'activities' && 'Are you sure you want to clear ALL activity logs? This action cannot be undone.'}
                {clearType === 'scratchEvents' && 'Are you sure you want to clear ALL scratch events? This action cannot be undone.'}
                {clearType === 'old' && `Are you sure you want to clear activities older than ${clearDays} days? This action cannot be undone.`}
                {clearType === 'all' && '⚠️ DANGER: Are you sure you want to clear ALL activities AND scratch events? This action cannot be undone.'}
              </p>
              {clearType === 'all' && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-red-700 text-sm font-semibold">This will permanently delete:</p>
                  <ul className="list-disc list-inside text-sm text-red-600 mt-1">
                    <li>All activity logs</li>
                    <li>All scratch events</li>
                  </ul>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClearConfirm}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
              >
                Yes, Clear
              </button>
              <button
                onClick={() => setShowClearModal(false)}
                className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}