'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

interface AdminAccount {
  id: string;
  username: string;
  createdAt: string;
}

export default function AdminAccountsPage() {
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await axios.get('/api/admin/accounts');
      setAdmins(res.data);
    } catch (err) {
      console.error('Failed to fetch admin accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setCreating(true);
    try {
      const res = await axios.post('/api/admin/accounts', { username, password });
      setMessage({ type: 'success', text: `Admin account "${res.data.username}" created successfully!` });
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      fetchAdmins();
    } catch (err: unknown) {
      const errorText = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create admin account';
      setMessage({ type: 'error', text: errorText });
    } finally {
      setCreating(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Admin Accounts</h1>
        <p className="text-gray-500 mt-1">Manage admin accounts and create new ones</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Admin Form */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Create New Admin Account</h2>

          {message && (
            <div
              className={`mb-4 p-3 rounded ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border rounded-lg px-4 py-2"
                placeholder="Enter username"
                required
                minLength={3}
                maxLength={30}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 pr-10"
                  placeholder="Enter password (min 8 characters)"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border rounded-lg px-4 py-2"
                placeholder="Confirm password"
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Admin Account'}
            </button>
          </form>
        </div>

        {/* Existing Admins List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Existing Admin Accounts</h2>
            <button
              onClick={fetchAdmins}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition text-sm"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : admins.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No admin accounts found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 pr-4 font-medium text-gray-600">Username</th>
                    <th className="py-2 pr-4 font-medium text-gray-600">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <span className="font-medium text-gray-800">{admin.username}</span>
                      </td>
                      <td className="py-3 pr-4 text-gray-500 text-sm">
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
