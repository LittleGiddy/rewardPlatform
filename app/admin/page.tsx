'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's what's happening with your platform.</p>
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
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activities</h2>
        <div className="space-y-3">
          {recentActivities.map((activity, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl">{activity.icon}</div>
              <div className="flex-1">
                <p className="text-gray-800">{activity.message}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
              {activity.status && (
                <span className={`px-2 py-1 rounded text-xs ${activity.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {activity.status}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}