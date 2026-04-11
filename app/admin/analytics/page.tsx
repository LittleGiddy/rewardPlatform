'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

interface AnalyticsData {
  pageViews: number;
  networkSelections: number;
  scratches: number;
  sharesCompleted: number;
  winners: number;
  networkDistribution: Record<string, number>;
  prizeDistribution: Record<string, number>;
  hourlyActivity: number[];
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get('/api/admin/analytics');
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const maxHourlyValue = Math.max(...analytics.hourlyActivity, 1);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
        <p className="text-gray-500 mt-1">Platform performance and conversion metrics</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <p className="text-white/80 text-sm">Page Views</p>
          <p className="text-2xl font-bold">{analytics.pageViews.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
          <p className="text-white/80 text-sm">Network Selections</p>
          <p className="text-2xl font-bold">{analytics.networkSelections.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <p className="text-white/80 text-sm">Scratches</p>
          <p className="text-2xl font-bold">{analytics.scratches.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-4 text-white">
          <p className="text-white/80 text-sm">Shares Completed</p>
          <p className="text-2xl font-bold">{analytics.sharesCompleted.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 text-white">
          <p className="text-white/80 text-sm">Total Winners</p>
          <p className="text-2xl font-bold">{analytics.winners.toLocaleString()}</p>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Conversion Funnel</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span>Page Views</span>
              <span className="font-bold">{analytics.pageViews.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 rounded-full h-2" style={{ width: '100%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span>Network Selected</span>
              <span className="font-bold">{analytics.networkSelections.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 rounded-full h-2" 
                style={{ width: `${analytics.pageViews > 0 ? (analytics.networkSelections / analytics.pageViews) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span>Scratches</span>
              <span className="font-bold">{analytics.scratches.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 rounded-full h-2" 
                style={{ width: `${analytics.pageViews > 0 ? (analytics.scratches / analytics.pageViews) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span>Shares Completed</span>
              <span className="font-bold">{analytics.sharesCompleted.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-500 rounded-full h-2" 
                style={{ width: `${analytics.pageViews > 0 ? (analytics.sharesCompleted / analytics.pageViews) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span>Winners</span>
              <span className="font-bold">{analytics.winners.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 rounded-full h-2" 
                style={{ width: `${analytics.pageViews > 0 ? (analytics.winners / analytics.pageViews) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Network Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Network Distribution</h2>
          <div className="space-y-3">
            {Object.entries(analytics.networkDistribution).map(([network, count]) => (
              <div key={network}>
                <div className="flex justify-between mb-1">
                  <span>{network}</span>
                  <span className="font-bold">{typeof count === 'number' ? count.toLocaleString() : count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full h-2" 
                    style={{ 
                      width: `${analytics.networkSelections > 0 
                        ? ((typeof count === 'number' ? count : 0) / analytics.networkSelections) * 100 
                        : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Prize Distribution</h2>
          <div className="space-y-3">
            {Object.entries(analytics.prizeDistribution).map(([amount, count]) => (
              <div key={amount}>
                <div className="flex justify-between mb-1">
                  <span>TZS {parseInt(amount).toLocaleString()}</span>
                  <span className="font-bold">{typeof count === 'number' ? count.toLocaleString() : count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full h-2" 
                    style={{ 
                      width: `${analytics.winners > 0 
                        ? ((typeof count === 'number' ? count : 0) / analytics.winners) * 100 
                        : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hourly Activity */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Hourly Activity (Last 24 Hours)</h2>
        <div className="flex items-end gap-1 h-64">
          {analytics.hourlyActivity.map((hourCount: number, idx: number) => (
            <div key={idx} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t transition-all duration-300"
                style={{ height: `${(hourCount / maxHourlyValue) * 100}%`, minHeight: '4px' }}
              ></div>
              <span className="text-xs mt-2 transform -rotate-45 origin-top-left">
                {idx}:00
              </span>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center text-sm text-gray-500">
          Peak activity shown in the chart above
        </div>
      </div>
    </div>
  );
}