'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [pools, setPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [amount, setAmount] = useState('');
  const [voucherCodes, setVoucherCodes] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('pools');
  const [totalRemaining, setTotalRemaining] = useState(0);
  const [showClearModal, setShowClearModal] = useState(false);
  const [voucherToClear, setVoucherToClear] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10000); // 10 seconds
  const [wsConnected, setWsConnected] = useState(false);

  const networks = ['Yas', 'Airtel', 'Vodacom', 'Halotel', 'MTN'];

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get('/api/admin/vouchers');
      setVouchers(res.data.vouchers || []);
      setPools(res.data.pools || []);
      
      const remaining = (res.data.pools || []).reduce((sum: number, pool: any) => sum + (pool.remainingVouchers || 0), 0);
      setTotalRemaining(remaining);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh every N seconds
  useEffect(() => {
    fetchData();
    
    let interval: NodeJS.Timeout;
    if (isAutoRefresh) {
      interval = setInterval(() => {
        console.log('[AutoRefresh] Fetching latest voucher data...');
        fetchData();
      }, refreshInterval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchData, isAutoRefresh, refreshInterval]);

  // Setup WebSocket for real-time updates (optional - more advanced)
  useEffect(() => {
    // Check if WebSocket is supported and we're in browser
    if (typeof window === 'undefined') return;
    
    // Optional: Setup WebSocket connection for instant updates
    // This would require a WebSocket server setup
    // For now, we'll rely on polling
    
    return () => {
      // Cleanup
    };
  }, []);

  const addVouchers = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    
    const codes = voucherCodes
      .split(/\n|,/)
      .map(code => code.trim().toUpperCase())
      .filter(code => code.length > 0);
    
    if (codes.length === 0) {
      setMessage('❌ Please enter at least one voucher code');
      setLoading(false);
      return;
    }
    
    try {
      const res = await axios.post('/api/admin/vouchers', {
        network: selectedNetwork,
        amount: parseInt(amount),
        voucherCodes: codes,
      });
      
      setMessage(`✅ ${res.data.message}`);
      setSelectedNetwork('');
      setAmount('');
      setVoucherCodes('');
      await fetchData(); // Immediate refresh after adding
      
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteVoucher = async (id: string, status: string) => {
    let confirmMessage = 'Are you sure you want to delete this voucher?';
    if (status === 'redeemed') {
      confirmMessage = '⚠️ This voucher has already been REDEEMED by a winner. Deleting it will remove the record. Are you sure?';
    } else if (status === 'locked') {
      confirmMessage = '⚠️ This voucher is currently LOCKED (user scratched but not claimed). Deleting it will free up the user. Are you sure?';
    }
    
    if (!confirm(confirmMessage)) return;
    
    try {
      await axios.delete(`/api/admin/vouchers?id=${id}`);
      await fetchData(); // Immediate refresh after delete
      setMessage(`✅ Voucher deleted successfully (Status: ${status})`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Failed to delete voucher');
    }
  };

  const clearVouchersByStatus = async (status: string) => {
    const statusNames = {
      available: 'AVAILABLE',
      redeemed: 'REDEEMED',
      locked: 'LOCKED'
    };
    
    if (!confirm(`⚠️ Are you sure you want to delete ALL ${statusNames[status as keyof typeof statusNames]} vouchers? This action cannot be undone.`)) return;
    
    try {
      const res = await axios.delete(`/api/admin/vouchers/clear?status=${status}`);
      setMessage(`✅ ${res.data.message}`);
      await fetchData(); // Immediate refresh after clear
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Failed to clear vouchers');
    }
  };

  const openClearModal = (voucher: any) => {
    setVoucherToClear(voucher);
    setShowClearModal(true);
  };

  const confirmClear = async () => {
    if (!voucherToClear) return;
    
    try {
      await axios.delete(`/api/admin/vouchers?id=${voucherToClear._id}`);
      setMessage(`✅ Voucher ${voucherToClear.voucherCode} deleted successfully`);
      await fetchData(); // Immediate refresh after delete
      setShowClearModal(false);
      setVoucherToClear(null);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Failed to delete voucher');
    }
  };

  // Format time since last update
  const getTimeSinceUpdate = () => {
    const seconds = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    return `${Math.floor(seconds / 3600)} hours ago`;
  };

  if (loading && vouchers.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const statusCounts = {
    available: vouchers.filter(v => v.status === 'available').length,
    redeemed: vouchers.filter(v => v.status === 'redeemed').length,
    locked: vouchers.filter(v => v.status === 'locked').length
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Voucher Management</h1>
          <p className="text-gray-500 mt-1">Upload voucher codes that winners will receive</p>
        </div>
        <div className="flex gap-3">
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={`px-3 py-2 rounded-lg text-sm transition ${
              isAutoRefresh 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-gray-100 text-gray-500 border border-gray-300'
            }`}
            title={isAutoRefresh ? 'Auto-refresh is ON' : 'Auto-refresh is OFF'}
          >
            {isAutoRefresh ? '🔄 Auto-Refresh ON' : '⏸️ Auto-Refresh OFF'}
          </button>
          <button
            onClick={fetchData}
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
          Real-time data updates automatically
        </div>
      </div>

      {/* Status Summary Cards with Live Counts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-xl p-4 border border-green-200 transition-all hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-green-600">Available Vouchers</p>
              <p className="text-2xl font-bold text-green-700">{statusCounts.available}</p>
            </div>
            <button
              onClick={() => statusCounts.available > 0 && clearVouchersByStatus('available')}
              className={`text-xs px-2 py-1 rounded ${statusCounts.available > 0 ? 'bg-green-200 text-green-800 hover:bg-green-300' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              disabled={statusCounts.available === 0}
            >
              Clear All
            </button>
          </div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 transition-all hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-yellow-600">Locked Vouchers</p>
              <p className="text-2xl font-bold text-yellow-700">{statusCounts.locked}</p>
            </div>
            <button
              onClick={() => statusCounts.locked > 0 && clearVouchersByStatus('locked')}
              className={`text-xs px-2 py-1 rounded ${statusCounts.locked > 0 ? 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              disabled={statusCounts.locked === 0}
            >
              Clear All
            </button>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 transition-all hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Redeemed Vouchers</p>
              <p className="text-2xl font-bold text-gray-700">{statusCounts.redeemed}</p>
            </div>
            <button
              onClick={() => statusCounts.redeemed > 0 && clearVouchersByStatus('redeemed')}
              className={`text-xs px-2 py-1 rounded ${statusCounts.redeemed > 0 ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              disabled={statusCounts.redeemed === 0}
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Low Stock Warning */}
      {totalRemaining > 0 && totalRemaining < 50 && (
        <div className="mb-6 p-4 rounded-xl bg-yellow-100 border border-yellow-400 text-yellow-700 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold">Low Voucher Alert!</p>
              <p className="text-sm">Only {totalRemaining} vouchers remaining across all networks. Please upload more vouchers soon.</p>
            </div>
          </div>
        </div>
      )}

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

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('pools')}
          className={`px-6 py-3 font-semibold transition ${
            activeTab === 'pools'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📊 Voucher Pools
          {pools.length > 0 && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
              {pools.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`px-6 py-3 font-semibold transition ${
            activeTab === 'add'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ➕ Upload Vouchers
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`px-6 py-3 font-semibold transition ${
            activeTab === 'list'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📋 All Vouchers ({vouchers.length})
        </button>
      </div>

      {/* Pools Tab - Summary with Live Data */}
      {activeTab === 'pools' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Voucher Pools Summary</h2>
              <p className="text-gray-500 text-sm">Overview of all voucher pools by network and amount</p>
            </div>
            <div className="text-xs text-gray-400">
              Total pools: {pools.length}
            </div>
          </div>
          
          {pools.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No voucher pools created yet. Go to "Upload Vouchers" to add your first vouchers.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 text-left">Network</th>
                    <th className="p-4 text-left">Amount (TZS)</th>
                    <th className="p-4 text-left">Total</th>
                    <th className="p-4 text-left">Remaining</th>
                    <th className="p-4 text-left">Won/Given</th>
                    <th className="p-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pools.map((pool) => {
                    const won = pool.totalVouchers - pool.remainingVouchers;
                    const percentage = pool.totalVouchers > 0 ? (won / pool.totalVouchers) * 100 : 0;
                    const isLowStock = pool.remainingVouchers > 0 && pool.remainingVouchers <= 10;
                    return (
                      <tr key={`${pool.network}-${pool.amount}`} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {pool.network}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-green-600">
                          TZS {pool.amount.toLocaleString()}
                        </td>
                        <td className="p-4">{pool.totalVouchers}</td>
                        <td className="p-4">
                          <span className={`font-bold ${
                            pool.remainingVouchers === 0 ? 'text-red-500' : 
                            isLowStock ? 'text-orange-500' : 'text-green-500'
                          }`}>
                            {pool.remainingVouchers}
                          </span>
                          {isLowStock && pool.remainingVouchers > 0 && (
                            <span className="ml-2 text-xs text-orange-500 animate-pulse">⚠️ Low stock!</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span>{won}</span>
                            <div className="w-20 bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-green-500 rounded-full h-1.5 transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-400">{Math.round(percentage)}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            pool.remainingVouchers > 0
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {pool.remainingVouchers > 0 ? 'Active' : 'Depleted'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Vouchers Tab */}
      {activeTab === 'add' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Upload Voucher Codes</h2>
          <p className="text-gray-500 text-sm mb-6">
            Enter voucher codes that winners will receive. Each code should be unique.
          </p>
          
          <form onSubmit={addVouchers} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Network</label>
                <select
                  value={selectedNetwork}
                  onChange={(e) => setSelectedNetwork(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Select Network --</option>
                  {networks.map(net => (
                    <option key={net} value={net}>{net}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Voucher Amount (TZS)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g., 500, 1000, 2000"
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="100"
                  step="100"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Voucher Codes</label>
              <textarea
                value={voucherCodes}
                onChange={(e) => setVoucherCodes(e.target.value)}
                placeholder="Enter voucher codes (one per line or comma separated)&#10;Example:&#10;YAS-ABCD-1234&#10;YAS-EFGH-5678"
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows={8}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter one voucher code per line or separate with commas. Codes will be converted to uppercase.
              </p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Summary:</strong> You are about to upload {voucherCodes.split(/\n|,/).filter(c => c.trim().length > 0).length} voucher(s) of TZS {amount || '0'} for {selectedNetwork || '[Network]'} network.
              </p>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50"
            >
              {loading ? 'Uploading...' : '📤 Upload Vouchers'}
            </button>
          </form>
        </div>
      )}

      {/* All Vouchers Tab */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">All Vouchers</h2>
              <p className="text-gray-500 text-sm">Complete list of all voucher codes in the system</p>
            </div>
            <div className="text-xs text-gray-400">
              Showing {vouchers.length} vouchers
            </div>
          </div>
          
          {vouchers.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No vouchers found. Upload some voucher codes to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 text-left">Voucher Code</th>
                    <th className="p-4 text-left">Network</th>
                    <th className="p-4 text-left">Amount</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Winner ID</th>
                    <th className="p-4 text-left">Created</th>
                    <th className="p-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map((voucher) => (
                    <tr key={voucher._id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                          {voucher.voucherCode || '—'}
                        </code>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {voucher.network}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-green-600">
                        TZS {voucher.amount?.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          voucher.status === 'available' ? 'bg-green-100 text-green-800' :
                          voucher.status === 'redeemed' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {voucher.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm">
                        {voucher.winnerId ? voucher.winnerId.slice(-8) : '—'}
                      </td>
                      <td className="p-4 text-sm">
                        {new Date(voucher.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => openClearModal(voucher)}
                          className={`px-3 py-1 rounded text-sm transition ${
                            voucher.status === 'available'
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : voucher.status === 'redeemed'
                              ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          }`}
                          title={`Delete this ${voucher.status} voucher`}
                        >
                          🗑️ Clear
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearModal && voucherToClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Confirm Delete</h3>
            <div className="mb-4">
              <p className="text-gray-700">Are you sure you want to delete this voucher?</p>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p><strong>Code:</strong> {voucherToClear.voucherCode}</p>
                <p><strong>Network:</strong> {voucherToClear.network}</p>
                <p><strong>Amount:</strong> TZS {voucherToClear.amount?.toLocaleString()}</p>
                <p><strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                    voucherToClear.status === 'available' ? 'bg-green-100 text-green-800' :
                    voucherToClear.status === 'redeemed' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {voucherToClear.status}
                  </span>
                </p>
                {voucherToClear.winnerId && (
                  <p><strong>Winner ID:</strong> {voucherToClear.winnerId}</p>
                )}
              </div>
              {voucherToClear.status === 'redeemed' && (
                <p className="text-orange-600 text-sm mt-2">⚠️ This voucher has already been redeemed by a winner.</p>
              )}
              {voucherToClear.status === 'locked' && (
                <p className="text-yellow-600 text-sm mt-2">⚠️ This voucher is currently locked (user scratched but not claimed).</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmClear}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
              >
                Yes, Delete
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