'use client';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearType, setClearType] = useState<'activities' | 'old' | 'all'>('activities');
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
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

const clearRecentActivities = async () => {
  setLoading(true);
  try {
    const res = await axios.delete('/api/admin/activities/clear');
    console.log('Clear response:', res.data);
    setMessage(`✅ ${res.data.message}`);
    await fetchDashboardData();
    setTimeout(() => setMessage(''), 3000);
  } catch (err: any) {
    console.error('Clear error:', err.response?.data || err.message);
    setMessage(`❌ Failed to clear activities: ${err.response?.data?.message || err.message}`);
    setTimeout(() => setMessage(''), 3000);
  } finally {
    setLoading(false);
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

  const handleClearConfirm = () => {
    setShowClearModal(false);
    if (clearType === 'activities') {
      clearRecentActivities();
    } else if (clearType === 'old') {
      clearOldActivities(clearDays);
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
              setClearType('activities');
              setShowClearModal(true);
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2"
          >
            <span>⚠️</span>
            <span>Clear All Activities</span>
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

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Recent Activities</h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setClearType('old');
                setShowClearModal(true);
              }}
              className="text-sm text-yellow-600 hover:text-yellow-800 transition px-3 py-1 rounded border border-yellow-300"
            >
              Clear Old
            </button>
            <button
              onClick={() => {
                setClearType('activities');
                setShowClearModal(true);
              }}
              className="text-sm text-red-600 hover:text-red-800 transition px-3 py-1 rounded border border-red-300"
            >
              Clear All
            </button>
          </div>
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
                {clearType === 'activities' && 'Are you sure you want to clear ALL recent activities? This action cannot be undone.'}
                {clearType === 'old' && `Are you sure you want to clear activities older than ${clearDays} days? This action cannot be undone.`}
              </p>
              {clearType === 'old' && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Days to keep</label>
                  <select
                    value={clearDays}
                    onChange={(e) => setClearDays(parseInt(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value={1}>Keep only last 1 day</option>
                    <option value={3}>Keep only last 3 days</option>
                    <option value={7}>Keep only last 7 days</option>
                    <option value={14}>Keep only last 14 days</option>
                    <option value={30}>Keep only last 30 days</option>
                  </select>
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