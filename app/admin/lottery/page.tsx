'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function LotteryDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return <div className="min-h-screen flex items-center justify-center">Access Denied</div>;
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading stats...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🎰 Lottery Dashboard</h1>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm">Total Users</p>
            <p className="text-3xl font-bold">{stats.summary.totalUsers}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm">Total Winners</p>
            <p className="text-3xl font-bold text-green-600">{stats.summary.totalWinners}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm">Win Rate</p>
            <p className="text-3xl font-bold text-blue-600">{stats.summary.winRate}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm">Active Vouchers</p>
            <p className="text-3xl font-bold text-orange-600">{stats.summary.activeVouchers}</p>
          </div>
        </div>

        {/* Win Distribution */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">🏆 Prize Distribution</h2>
          <div className="space-y-3">
            {stats.winDistribution.map((item: any) => (
              <div key={item._id}>
                <div className="flex justify-between mb-1">
                  <span>KSH {item._id}</span>
                  <span>{item.count} winners</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 rounded-full h-2"
                    style={{ width: `${(item.count / stats.summary.totalWinners) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Wins Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">📊 Daily Wins (Last 30 Days)</h2>
          <div className="space-y-3">
            {stats.last30DaysWins.slice(-7).map((day: any) => (
              <div key={day._id}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{day._id}</span>
                  <span className="text-sm">{day.count} wins</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 rounded-full h-2"
                    style={{ width: `${(day.count / Math.max(...stats.last30DaysWins.map((d: any) => d.count))) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-500 text-center">
          <p>Win probability: 1 in 500 users (0.2%)</p>
          <p>Streak bonus increases chances after consecutive losses</p>
        </div>
      </div>
    </div>
  );
}