'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function SharePage() {
  const router = useRouter();
  const [link, setLink] = useState('');
  const [clicks, setClicks] = useState(0);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/share-link').then(res => {
      setLink(res.data.link);
      setClicks(res.data.clickCount);
      setLoading(false);
    });
  }, []);

  const checkShares = async () => {
    const res = await axios.post('/api/verify-share');
    if (res.data.verified) {
      setVerified(true);
      const claimRes = await axios.post('/api/claim');
      if (claimRes.data.winner) {
        router.push('/winner?amount=' + claimRes.data.amount);
      } else {
        router.push('/retry');
      }
    } else {
      alert(`You need 3 unique clicks. Current: ${res.data.clicks}`);
    }
  };

  // Development skip function
  const skipForTesting = async () => {
    console.log('Skipping share verification for testing');
    const claimRes = await axios.post('/api/claim');
    if (claimRes.data.winner) {
      router.push('/winner?amount=' + claimRes.data.amount);
    } else {
      router.push('/retry');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Share to Unlock</h2>
        <p className="mb-4">Share this link with 3 friends. Each must click and visit the page.</p>
        <div className="flex mb-4">
          <input
            type="text"
            value={link}
            readOnly
            className="flex-1 border rounded-l px-3 py-2"
          />
          <button
            onClick={() => navigator.clipboard.writeText(link)}
            className="bg-blue-600 text-white px-4 py-2 rounded-r"
          >
            Copy
          </button>
        </div>
        <div className="flex gap-2 mb-6">
          <a
            href={`https://wa.me/?text=${encodeURIComponent('I just scratched a voucher! Click my link to claim yours too: ' + link)}`}
            target="_blank"
            className="bg-green-500 text-white px-4 py-2 rounded flex-1 text-center"
          >
            WhatsApp
          </a>
          <button className="bg-blue-500 text-white px-4 py-2 rounded flex-1">Facebook</button>
        </div>
        <p className="text-center mb-4">Clicks so far: {clicks}</p>
        <button
          onClick={checkShares}
          className="w-full bg-yellow-500 text-black py-3 rounded font-semibold mb-3"
        >
          I've shared! Check & Claim
        </button>
        
        {/* Development skip button */}
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={skipForTesting}
            className="w-full bg-gray-500 text-white py-3 rounded font-semibold"
          >
            🧪 Skip Sharing (Dev Only)
          </button>
        )}
      </div>
    </div>
  );
}