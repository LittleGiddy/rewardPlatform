'use client';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export default function AdminScratchEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10000); // 10 seconds
  const [filterNetwork, setFilterNetwork] = useState('');
  const [filterAmount, setFilterAmount] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearOption, setClearOption] = useState<'all' | 'older' | 'network'>('all');
  const [clearDays, setClearDays] = useState(7);

  const networks = ['Yas', 'Airtel', 'Vodacom', 'Halotel', 'MTN'];

  const fetchEvents = useCallback(async () => {
    try {
      const res = await axios.get('/api/admin/scratch-events');
      setEvents(res.data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch scratch events:', err);
      setMessage('❌ Failed to load scratch events');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh
  useEffect(() => {
    fetchEvents();
    
    let interval: NodeJS.Timeout;
    if (isAutoRefresh) {
      interval = setInterval(() => {
        console.log('[AutoRefresh] Fetching latest scratch events...');
        fetchEvents();
      }, refreshInterval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchEvents, isAutoRefresh, refreshInterval]);

  // Clear all scratch events
  const clearAllEvents = async () => {
    if (!confirm('⚠️ Are you sure you want to delete ALL scratch events? This action cannot be undone.')) return;
    
    try {
      const res = await axios.delete('/api/admin/scratch-events/clear');
      setMessage(`✅ ${res.data.message}`);
      await fetchEvents();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Failed to clear scratch events');
    }
  };

  // Clear events older than N days
  const clearEventsOlderThan = async (days: number) => {
    if (!confirm(`⚠️ Are you sure you want to delete scratch events older than ${days} days? This action cannot be undone.`)) return;
    
    try {
      const res = await axios.delete(`/api/admin/scratch-events/clear?olderThanDays=${days}`);
      setMessage(`✅ ${res.data.message}`);
      await fetchEvents();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Failed to clear old scratch events');
    }
  };

  // Clear events by network
  const clearEventsByNetwork = async (network: string) => {
    if (!confirm(`⚠️ Are you sure you want to delete ALL scratch events for ${network} network? This action cannot be undone.`)) return;
    
    try {
      const res = await axios.delete(`/api/admin/scratch-events/clear?network=${network}`);
      setMessage(`✅ ${res.data.message}`);
      await fetchEvents();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Failed to clear scratch events');
    }
  };

  // Delete a single event
  const deleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scratch event?')) return;
    
    try {
      await axios.delete(`/api/admin/scratch-events?id=${id}`);
      setMessage(`✅ Scratch event deleted successfully`);
      await fetchEvents();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Failed to delete event');
    }
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    if (filterNetwork && event.userId?.network !== filterNetwork) return false;
    if (filterAmount && event.revealedAmount !== parseInt(filterAmount)) return false;
    return true;
  });

  // Stats
  const totalEvents = events.length;
  const uniqueUsers = new Set(events.map(e => e.userId?._id)).size;
  const totalAmount = events.reduce((sum, e) => sum + (e.revealedAmount || 0), 0);
  const avgAmount = totalEvents > 0 ? totalAmount / totalEvents : 0;

  const getTimeSinceUpdate = () => {
    const seconds = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    return `${Math.floor(seconds / 3600)} hours ago`;
  };

  if (loading && events.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Scratch Events</h1>
          <p className="text-gray-500 mt-1">Monitor and manage all scratch card activities</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={`px-3 py-2 rounded-lg text-sm transition ${
              isAutoRefresh 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-gray-100 text-gray-500 border border-gray-300'
            }`}
          >
            {isAutoRefresh ? '🔄 Auto-Refresh ON' : '⏸️ Auto-Refresh OFF'}
          </button>
          <button
            onClick={fetchEvents}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <span>🔄</span>
            <span>Refresh Now</span>
          </button>
        </div>
      </div>

      {/* Real-time Status Bar */}
      <div className="mb-6 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${isAutoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
            <span className="text-gray-500">
              {isAutoRefresh ? `Auto-refreshing every ${refreshInterval / 1000}s` : 'Manual refresh only'}
            </span>
          </div>
          <span className="text-gray-400">|</span>
          <span className="text-gray-500">
            Last updated: {getTimeSinceUpdate()}
          </span>
        </div>
        <div className="text-gray-400 text-xs">
          {totalEvents} total events recorded
        </div>
      </div>

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <p className="text-white/80 text-sm">Total Scratching Events</p>
          <p className="text-3xl font-bold">{totalEvents.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <p className="text-white/80 text-sm">Unique Users</p>
          <p className="text-3xl font-bold">{uniqueUsers.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
          <p className="text-white/80 text-sm">Total Potential Prizes</p>
          <p className="text-3xl font-bold">TZS {totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white">
          <p className="text-white/80 text-sm">Average Scratch Amount</p>
          <p className="text-3xl font-bold">TZS {Math.round(avgAmount).toLocaleString()}</p>
        </div>
      </div>

      {/* Clear Events Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Clear Scratch Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={clearAllEvents}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            🗑️ Clear All Events
          </button>
          <button
            onClick={() => clearEventsOlderThan(7)}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
          >
            📅 Clear Events &gt; 7 Days
          </button>
          <button
            onClick={() => clearEventsOlderThan(30)}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
          >
            📅 Clear Events &gt; 30 Days
          </button>
          <div className="flex gap-2">
            <select
              value={clearDays}
              onChange={(e) => setClearDays(parseInt(e.target.value))}
              className="border rounded-lg px-3 py-2 flex-1"
            >
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
            <button
              onClick={() => clearEventsOlderThan(clearDays)}
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition"
            >
              Clear &gt; {clearDays} Days
            </button>
          </div>
        </div>
        {networks.map(network => (
          <button
            key={network}
            onClick={() => clearEventsByNetwork(network)}
            className="mt-2 mr-2 bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 transition"
          >
            Clear {network}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Filter Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Network</label>
            <select
              value={filterNetwork}
              onChange={(e) => setFilterNetwork(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
            >
              <option value="">All Networks</option>
              {networks.map(net => (
                <option key={net} value={net}>{net}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (TZS)</label>
            <input
              type="number"
              value={filterAmount}
              onChange={(e) => setFilterAmount(e.target.value)}
              placeholder="Filter by amount"
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterNetwork('');
                setFilterAmount('');
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Scratch Events Log</h2>
            <p className="text-gray-500 text-sm">Complete history of all scratch activities</p>
          </div>
          <div className="text-xs text-gray-400">
            Showing {filteredEvents.length} of {totalEvents} events
          </div>
        </div>
        
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No scratch events found. Users will appear here when they scratch cards.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-left">User</th>
                  <th className="p-4 text-left">Network</th>
                  <th className="p-4 text-left">Revealed Amount</th>
                  <th className="p-4 text-left">Voucher ID</th>
                  <th className="p-4 text-left">Timestamp</th>
                  <th className="p-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr key={event._id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-mono text-sm">{event.userId?._id?.slice(-8) || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{event.userId?.network || 'No network'}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {event.userId?.network || 'Unknown'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-green-600">
                        TZS {event.revealedAmount?.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {event.voucherId?.slice(-8) || '—'}
                      </code>
                    </td>
                    <td className="p-4 text-sm">
                      {new Date(event.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => deleteEvent(event._id)}
                        className="text-red-600 hover:text-red-800 text-sm transition"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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