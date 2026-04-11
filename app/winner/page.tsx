import { Suspense } from 'react';
import WinnerContent from './WinnerContent';

export default function WinnerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-500 to-green-700">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <WinnerContent />
    </Suspense>
  );
}