'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ScratchEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axios.get('/api/admin/scratch-events');
      setEvents(res.data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => 
    event.revealedAmount?.toString().includes(filter) ||
    event.userId?.network?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Scratch Events</h1>
          <p className="text-gray-500 mt-1">Monitor all scratch card activities</p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Filter by amount or network..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded-lg px-4 py-2 w-64"
          />
          <button
            onClick={fetchEvents}
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
                <th className="p-4 text-left">User</th>
                <th className="p-4 text-left">Network</th>
                <th className="p-4 text-left">Revealed Amount</th>
                <th className="p-4 text-left">Timestamp</th>
               </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event._id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-mono text-sm">{event.userId?._id?.slice(-8) || 'Unknown'} </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {event.userId?.network || 'Unknown'}
                    </span>
                   </td>
                  <td className="p-4">
                    <span className="font-bold text-green-600">TSH {event.revealedAmount?.toLocaleString()}</span>
                   </td>
                  <td className="p-4 text-sm">{new Date(event.timestamp).toLocaleString()} </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}