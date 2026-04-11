'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.network?.toLowerCase().includes(search.toLowerCase()) ||
    user._id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Users Management</h1>
          <p className="text-gray-500 mt-1">View and manage all platform users</p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search by ID or network..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg px-4 py-2 w-64"
          />
          <button
            onClick={fetchUsers}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-left">User ID</th>
                <th className="p-4 text-left">Network</th>
                <th className="p-4 text-left">Phone</th>
                <th className="p-4 text-left">Attempts Today</th>
                <th className="p-4 text-left">Consecutive Losses</th>
                <th className="p-4 text-left">Total Wins</th>
                <th className="p-4 text-left">Joined</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-mono text-sm">{user._id.slice(-8)}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {user.network}
                    </span>
                  </td>
                  <td className="p-4">{user.phone || '—'}</td>
                  <td className="p-4">{user.attemptsToday || 0}/5</td>
                  <td className="p-4">
                    <span className={`font-bold ${user.consecutiveLosses > 3 ? 'text-orange-500' : 'text-gray-700'}`}>
                      {user.consecutiveLosses || 0}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-green-600 font-bold">{user.totalWins || 0}</span>
                  </td>
                  <td className="p-4 text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">User Details</h3>
              <button onClick={() => setSelectedUser(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="space-y-3">
              <p><strong>User ID:</strong> {selectedUser._id}</p>
              <p><strong>Network:</strong> {selectedUser.network}</p>
              <p><strong>Phone:</strong> {selectedUser.phone || 'Not provided'}</p>
              <p><strong>Created:</strong> {new Date(selectedUser.createdAt).toLocaleString()}</p>
              <p><strong>Last Attempt:</strong> {selectedUser.lastAttemptAt ? new Date(selectedUser.lastAttemptAt).toLocaleString() : 'Never'}</p>
              <p><strong>Consecutive Losses:</strong> {selectedUser.consecutiveLosses || 0}</p>
              <p><strong>Current Voucher:</strong> {selectedUser.currentRevealedAmount ? `TSH ${selectedUser.currentRevealedAmount}` : 'None'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}