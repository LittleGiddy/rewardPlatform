'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';

export default function ReferralPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;

    const trackReferral = async () => {
      try {
        console.log('Tracking referral for code:', userId);
        
        // Call the referral tracking API
        await axios.get(`/api/ref/${userId}`);
        
        // Redirect to home page after tracking
        router.push('/');
      } catch (err) {
        console.error('Referral tracking failed:', err);
        setError('Something went wrong. Redirecting...');
        
        // Still redirect to home after error
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    trackReferral();
  }, [userId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-600 to-purple-700">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-600 to-purple-700">
        <div className="text-white text-center">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return null;
}