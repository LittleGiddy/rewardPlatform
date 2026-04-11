import { Suspense } from 'react';
import WinnerContent from './WinnerContent';

export const dynamic = 'force-dynamic';

export default function WinnerPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WinnerContent />
    </Suspense>
  );
}