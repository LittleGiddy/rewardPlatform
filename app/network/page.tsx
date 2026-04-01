'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function NetworkPage() {
  const router = useRouter();
  const [network, setNetwork] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    console.log('Submitting network:', network);
    try {
      const response = await axios.post('/api/init', { network });
      console.log('API response:', response.data);
      console.log('Redirecting to /scan...');
      router.push('/scan');
    } catch (err: any) {
      console.error('API error:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6">Select Your Network</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="mb-6">
          <label className="block mb-2">Network</label>
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
            disabled={loading}
          >
            <option value="">Select</option>
            <option value="Yas">Yas</option>
            <option value="Airtel">Airtel</option>
            <option value="Vodacom">Vodacom</option>
            <option value="Halotel">Halotel</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Continue'}
        </button>
      </form>
    </div>
  );
}