'use client';
import { useState, useEffect } from 'react';
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

  const networks = ['Yas', 'Airtel', 'Vodacom', 'Halotel', 'MTN'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/admin/vouchers');
      setVouchers(res.data.vouchers || []);
      setPools(res.data.pools || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setMessage('❌ Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };

  const addVouchers = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    
    // Parse voucher codes (one per line or comma separated)
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
      fetchData();
      
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteVoucher = async (id: string) => {
    if (!confirm('Are you sure you want to delete this voucher?')) return;
    
    try {
      await axios.delete(`/api/admin/vouchers?id=${id}`);
      fetchData();
      setMessage('✅ Voucher deleted successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Failed to delete voucher');
    }
  };

  if (loading && vouchers.length === 0) {
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
          <h1 className="text-3xl font-bold text-gray-800">Voucher Management</h1>
          <p className="text-gray-500 mt-1">Upload voucher codes that winners will receive</p>
        </div>
        <button
          onClick={fetchData}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
        >
          Refresh
        </button>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl ${
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

      {/* Pools Tab - Summary */}
      {activeTab === 'pools' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Voucher Pools Summary</h2>
            <p className="text-gray-500 text-sm">Overview of all voucher pools by network and amount</p>
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
                    <th className="p-4 text-left">Total Vouchers</th>
                    <th className="p-4 text-left">Remaining</th>
                    <th className="p-4 text-left">Won/Given</th>
                    <th className="p-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pools.map((pool) => {
                    const won = pool.totalVouchers - pool.remainingVouchers;
                    return (
                      <tr key={`${pool.network}-${pool.amount}`} className="border-b hover:bg-gray-50">
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
                          <span className={`font-bold ${pool.remainingVouchers === 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {pool.remainingVouchers}
                          </span>
                        </td>
                        <td className="p-4">{won}</td>
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

      {/* Add Vouchers Tab - Upload Codes */}
      {activeTab === 'add' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Upload Voucher Codes</h2>
          <p className="text-gray-500 text-sm mb-6">
            Enter voucher codes that winners will receive. Each code should be unique.
          </p>
          
          <form onSubmit={addVouchers} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Network
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Voucher Amount (TZS)
                </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Voucher Codes
              </label>
              <textarea
                value={voucherCodes}
                onChange={(e) => setVoucherCodes(e.target.value)}
                placeholder="Enter voucher codes (one per line or comma separated)&#10;Example:&#10;YAS-ABCD-1234&#10;YAS-EFGH-5678&#10;YAS-IJKL-9012"
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

      {/* All Vouchers Tab - List of Codes */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">All Vouchers</h2>
            <p className="text-gray-500 text-sm">Complete list of all voucher codes in the system</p>
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
                    <tr key={voucher._id} className="border-b hover:bg-gray-50">
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
                          voucher.status === 'locked' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
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
                          onClick={() => deleteVoucher(voucher._id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                          disabled={voucher.status !== 'available'}
                          title={voucher.status !== 'available' ? 'Cannot delete claimed vouchers' : ''}
                        >
                          {voucher.status === 'available' ? 'Delete' : 'Locked'}
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
    </div>
  );
}