'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ScanPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/scratch');
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <div className="text-3xl mb-4 animate-pulse">Checking your network eligibility...</div>
      <div className="w-16 h-16 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
      <p className="mt-4">This will only take a moment</p>
    </div>
  );
}