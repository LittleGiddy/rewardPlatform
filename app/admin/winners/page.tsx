'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function WinnersPage() {
  const [winners, setWinners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchWinners();
  }, []);

  const fetchWinners = async () => {
    try {
      const res = await axios.get('/api/admin/winners');
      setWinners(res.data);
    } catch (err) {
      console.error('Failed to fetch winners:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredWinners = winners.filter(winner => {
    if (filter === 'all') return true;
    return winner.status === filter;
  });

  const totalPrize = winners.reduce((sum, w) => sum + (w.prizeAmount || 0), 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Winners Management</h1>
          <p className="text-gray-500 mt-1">Track all voucher winners and redemptions</p>
        </div>
        <div className="flex gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="all">All Winners</option>
            <option value="available">Not Redeemed</option>
            <option value="redeemed">Redeemed</option>
          </select>
          <button
            onClick={fetchWinners}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
          <p className="text-white/80 text-sm">Total Winners</p>
          <p className="text-2xl font-bold">{winners.length}</p>
        </div>
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-4 text-white">
          <p className="text-white/80 text-sm">Total Prize Money</p>
          <p className="text-2xl font-bold">TSH {totalPrize.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <p className="text-white/80 text-sm">Average Prize</p>
          <p className="text-2xl font-bold">TSH {winners.length ? Math.round(totalPrize / winners.length).toLocaleString() : 0}</p>
        </div>
      </div>

      {/* Winners Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-left">Winner</th>
                <th className="p-4 text-left">Network</th>
                <th className="p-4 text-left">Prize Amount</th>
                <th className="p-4 text-left">Voucher Code</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Won At</th>
                <th className="p-4 text-left">Redeemed At</th>
              </tr>
            </thead>
            <tbody>
              {filteredWinners.map((winner) => (
                <tr key={winner._id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{winner.userId?.network || 'Unknown'}</p>
                      <p className="text-xs text-gray-500 font-mono">{winner.userId?._id?.slice(-8)}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {winner.network}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-green-600">TSH {winner.prizeAmount?.toLocaleString()}</span>
                  </td>
                  <td className="p-4">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{winner.voucherCode}</code>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      winner.status === 'redeemed' ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {winner.status === 'redeemed' ? 'Redeemed' : 'Available'}
                    </span>
                  </td>
                  <td className="p-4 text-sm">{new Date(winner.wonAt).toLocaleString()}</td>
                  <td className="p-4 text-sm">{winner.redeemedAt ? new Date(winner.redeemedAt).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}